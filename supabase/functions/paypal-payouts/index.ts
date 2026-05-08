import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders } from "../_shared/cors.ts"
import { getPayPalAccessToken, PAYPAL_API_URL } from "../_shared/paypal.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usamos Service Role para transacciones contables
    )

    // 1. Obtener usuario de la sesión
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. SEGURIDAD: Verificar que el usuario es un influencer activo
    const { data: affiliate, error: affError } = await supabaseClient
      .from('affiliates')
      .select('id, user_id, status')
      .eq('user_id', user.id)
      .eq('status', 'activo')
      .maybeSingle()

    if (affError || !affiliate) {
      throw new Error('Solo los influencers activos pueden solicitar retiros.')
    }

    // 3. IDEMPOTENCIA: Verificar que no hay un payout en proceso (últimos 60 segundos)
    const { data: recentPayout } = await supabaseClient
      .from('financial_ledger')
      .select('id, created_at')
      .eq('user_id', user.id)
      .eq('entry_type', 'payout')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .limit(1)
      .maybeSingle()

    if (recentPayout) {
      throw new Error('Ya tienes un retiro en proceso. Espera al menos 60 segundos antes de intentar de nuevo.')
    }

    // 4. Verificar elegibilidad (RPC can_request_payout)
    const { data: canRequest, error: canError } = await supabaseClient.rpc('can_request_payout', { u_id: user.id })
    if (canError) throw canError
    if (!canRequest) throw new Error('Aun no puedes solicitar un retiro. Revisa tu frecuencia configurada.')

    // 5. Obtener Balance y cuenta de PayPal
    const { data: profile, error: profError } = await supabaseClient
      .from('profiles')
      .select('paypal_email')
      .eq('id', user.id)
      .single()
    
    if (profError || !profile?.paypal_email) throw new Error('No tienes configurado un email de PayPal para retiros.')

    const { data: balance, error: balError } = await supabaseClient.rpc('get_user_ledger_balance', { u_id: user.id })
    if (balError) throw balError

    if (balance < 10) throw new Error('El balance minimo para retirar es de USD 10.00')

    // 6. Iniciar Payout en PayPal
    const accessToken = await getPayPalAccessToken()
    const senderBatchId = `payout-${user.id.slice(0,8)}-${Date.now()}`

    const payoutResponse = await fetch(`${PAYPAL_API_URL}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: senderBatchId,
          email_subject: "Recibiste un pago de FigusUy! 🚀",
          email_message: `Hola! Retiraste USD ${balance} de tus comisiones en FigusUy. Gracias por ser parte!`
        },
        items: [{
          recipient_type: "EMAIL",
          amount: { value: balance.toString(), currency: "USD" },
          note: "Retiro de comisiones FigusUy",
          receiver: profile.paypal_email,
          sender_item_id: `item-${Date.now()}`
        }]
      })
    })

    const payoutData = await payoutResponse.json()
    if (!payoutResponse.ok) {
      console.error('PayPal Payout Error:', payoutData)
      throw new Error(`PayPal Error: ${payoutData.message || 'Error al procesar el retiro'}`)
    }

    // 7. Registrar en el Libro Contable y actualizar fecha de ultimo retiro
    await supabaseClient.from('financial_ledger').insert({
      user_id: user.id,
      amount: -balance, // Negativo porque sale dinero del sistema
      currency: 'USD',
      entry_type: 'payout',
      reference_type: 'payout_batch',
      description: `Retiro exitoso vía PayPal. Batch: ${payoutData.batch_header.payout_batch_id}`,
      metadata: { paypal_data: payoutData }
    })

    await supabaseClient.from('profiles').update({
      last_payout_at: new Date().toISOString()
    }).eq('id', user.id)

    return new Response(JSON.stringify({ 
      success: true, 
      batch_id: payoutData.batch_header.payout_batch_id,
      amount: balance
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Payout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
