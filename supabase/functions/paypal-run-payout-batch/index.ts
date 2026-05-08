import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getPayPalAccessToken, PAYPAL_API_URL } from "../_shared/paypal.ts"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    // 1. Gather Pending Payout Items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('payout_items')
      .select('*, payout_accounts(payout_email)')
      .eq('status', 'pending')
      .limit(500)

    if (itemsError) throw itemsError
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending payouts' }), { status: 200 })
    }

    // 2. Create Batch Record
    const totalAmount = items.reduce((sum, item) => sum + Math.abs(parseFloat(item.amount)), 0)
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('payout_batches')
      .insert({
        total_amount: totalAmount,
        currency: 'USD',
        item_count: items.length,
        status: 'pending'
      })
      .select()
      .single()

    if (batchError) throw batchError

    // 3. Prepare PayPal Payload
    const paypalItems = items.map((item) => ({
      note: item.metadata?.description || "FigusUy Payout",
      receiver: item.payout_accounts.payout_email,
      sender_item_id: item.id,
      amount: {
        currency: "USD",
        value: Math.abs(parseFloat(item.amount)).toFixed(2)
      }
    }))

    // 4. Call PayPal Payouts API
    const accessToken = await getPayPalAccessToken()
    const senderBatchHeader = {
      sender_batch_id: batch.id,
      email_subject: "Has recibido un pago de FigusUy",
      email_message: "Tus ganancias como afiliado/influencer han sido enviadas. ¡Gracias por ser parte de la comunidad!"
    }

    const response = await fetch(`${PAYPAL_API_URL}/v1/payments/payouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_batch_header: senderBatchHeader,
        items: paypalItems
      })
    })

    const paypalData = await response.json()

    if (!response.ok) {
      console.error('PayPal Payout Error:', paypalData)
      await supabaseAdmin.from('payout_batches').update({
        status: 'failed',
        error_message: paypalData.message || 'PayPal API Error'
      }).eq('id', batch.id)
      
      throw new Error(`PayPal Payout failed: ${paypalData.message}`)
    }

    // 5. Update Status
    const providerBatchId = paypalData.batch_header.payout_batch_id
    
    await supabaseAdmin.from('payout_batches').update({
      provider_batch_id: providerBatchId,
      status: 'processing',
      executed_at: new Date().toISOString()
    }).eq('id', batch.id)

    await supabaseAdmin.from('payout_items').update({
      batch_id: batch.id,
      status: 'processing'
    }).in('id', items.map(i => i.id))

    return new Response(JSON.stringify({ success: true, batchId: batch.id, providerBatchId }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Run Payout Batch error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
