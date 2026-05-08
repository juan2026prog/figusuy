import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // Check if user is Admin or God Admin
    const { data: role } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['god_admin', 'admin'])
      .single()
    
    if (!role) throw new Error('Forbidden: Admin access required')

    const { affiliateUserId, amount, description } = await req.json()
    if (!affiliateUserId || !amount) throw new Error('Missing affiliateUserId or amount')

    // 1. Validate Payout Account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('payout_accounts')
      .select('id, payout_email')
      .eq('user_id', affiliateUserId)
      .single()

    if (accountError || !account) throw new Error('Affiliate has no payout account configured')

    // 2. Check Ledger Balance (Safety)
    const { data: ledgerTotal } = await supabaseAdmin
      .rpc('get_user_ledger_balance', { u_id: affiliateUserId })
    
    // Note: I need to create the get_user_ledger_balance RPC in a migration
    const balance = ledgerTotal || 0
    if (balance < amount) throw new Error(`Insufficient funds. Balance: ${balance}`)

    // 3. Create Payout Item (Queued)
    const { data: payoutItem, error: payoutError } = await supabaseAdmin
      .from('payout_items')
      .insert({
        user_id: affiliateUserId,
        payout_account_id: account.id,
        amount: -Math.abs(amount), // Debit from ledger
        currency: 'USD',
        status: 'pending',
        metadata: { description }
      })
      .select()
      .single()

    if (payoutError) throw payoutError

    // 4. Create Ledger Entry (Pending Payout)
    await supabaseAdmin.from('financial_ledger').insert({
        user_id: affiliateUserId,
        amount: -Math.abs(amount),
        currency: 'USD',
        entry_type: 'payout',
        reference_type: 'payout_item',
        reference_id: payoutItem.id,
        description: description || `Payout request for ${account.payout_email}`
    })

    return new Response(JSON.stringify({ success: true, payoutItemId: payoutItem.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Payout creation error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
