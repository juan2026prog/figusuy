import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function activateOrder(orderId: string, paymentId: string | number | null, status: string) {
  const { data: order, error: orderError } = await supabaseAdmin
    .from('plan_orders')
    .select('id, user_id, plan_id, status')
    .eq('id', orderId)
    .maybeSingle()

  if (orderError || !order) {
    throw new Error(`Order not found for external_reference ${orderId}`)
  }

  const { data: plan, error: planError } = await supabaseAdmin
    .from('premium_plans')
    .select('id, name')
    .eq('id', order.plan_id)
    .single()

  if (planError || !plan) {
    throw new Error(`Plan not found for order ${order.id}`)
  }

  const normalizedPlan = String(plan.name || 'gratis').toLowerCase().includes('pro') ? 'pro' : 'plus'
  const activatedAt = new Date().toISOString()

  await supabaseAdmin
    .from('profiles')
    .update({ is_premium: true, plan_name: normalizedPlan })
    .eq('id', order.user_id)

  await supabaseAdmin
    .from('plan_orders')
    .update({
      status: ['approved', 'authorized', 'active'].includes(status) ? 'paid' : order.status,
      payment_id: paymentId ? String(paymentId) : null
    })
    .eq('id', order.id)

  const { data: activeSub } = await supabaseAdmin
    .from('subscriptions')
    .select('id')
    .eq('user_id', order.user_id)
    .in('status', ['active', 'paused'])
    .maybeSingle()

  if (activeSub?.id) {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan_name: normalizedPlan,
        status: 'active',
        starts_at: activatedAt,
        cancelled_at: null,
        paused_at: null
      })
      .eq('id', activeSub.id)
  } else {
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: order.user_id,
        plan_name: normalizedPlan,
        status: 'active',
        starts_at: activatedAt,
        auto_renew: true
      })
  }

  await supabaseAdmin.from('audit_log').insert({
    module: 'monetization',
    action: 'subscription_payment',
    target_id: order.user_id,
    changer_id: null,
    new_value: {
      order_id: order.id,
      plan_id: order.plan_id,
      plan_name: normalizedPlan,
      payment_id: paymentId,
      status
    }
  })
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    if (!id) {
      return new Response('No ID provided', { status: 400 })
    }

    const mpHeaders = {
      'Authorization': `Bearer ${Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')}`
    }

    if (topic === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: mpHeaders
      })
      const payment = await response.json()

      if (payment.status === 'approved' && payment.external_reference) {
        await activateOrder(payment.external_reference, payment.id, payment.status)
      }
    }

    if (topic === 'preapproval') {
      const response = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: mpHeaders
      })
      const preapproval = await response.json()

      if (
        ['authorized', 'active'].includes(preapproval.status) &&
        preapproval.external_reference
      ) {
        await activateOrder(preapproval.external_reference, preapproval.id, preapproval.status)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(err.message, { status: 500 })
  }
})
