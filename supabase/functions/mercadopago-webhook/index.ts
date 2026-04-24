import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    console.log("📥 MercadoPago Webhook:", body.action, body.type, body.data?.id)

    // Handle subscription_preapproval notifications
    if (body.type === "subscription_preapproval" || body.topic === "subscription_preapproval") {
      const subId = body.data?.id
      if (!subId) throw new Error("No subscription ID in webhook payload")

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? ""

      if (!mpAccessToken) throw new Error("Mercado Pago Access Token no configurado.")
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      // 1. Verify subscription status with MP
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${subId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      })
      const subData = await mpResponse.json()
      
      if (!mpResponse.ok) throw new Error(`Fetch failed from MP Preapproval: ${JSON.stringify(subData)}`)

      const orderId = subData.external_reference
      if (!orderId) {
        console.warn("[MP Webhook] No external_reference (Order ID) found in subscription.")
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // 2. Fetch the order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('plan_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) throw new Error(`Orden ${orderId} no encontrada.`)

      // 3. Update status based on subscription
      if (subData.status === "authorized") {
        console.log(`[MP Webhook] Subscription ${subId} AUTHORIZED. Upgrading user ${order.user_id}`)
        
        await supabaseAdmin
          .from("plan_orders")
          .update({ 
            status: "paid", 
            payment_id: subId.toString(),
            updated_at: new Date().toISOString()
          })
          .eq("id", orderId)

        await supabaseAdmin
          .from("profiles")
          .update({ 
            is_premium: true,
            premium_plan_id: order.plan_id,
            last_active: new Date().toISOString()
          })
          .eq("id", order.user_id)
      } else if (subData.status === "cancelled" || subData.status === "paused") {
        console.log(`[MP Webhook] Subscription ${subId} CANCELLED/PAUSED. Downgrading user ${order.user_id}`)
        
        await supabaseAdmin
          .from("plan_orders")
          .update({ 
            status: subData.status, 
            updated_at: new Date().toISOString()
          })
          .eq("id", orderId)

        await supabaseAdmin
          .from("profiles")
          .update({ 
            is_premium: false,
            premium_plan_id: null,
            last_active: new Date().toISOString()
          })
          .eq("id", order.user_id)
      }
    }
    // Also handle regular payments (for first charge or subsequent charges)
    else if (body.type === "payment" && (body.action === "payment.created" || body.action === "payment.updated")) {
      const paymentId = body.data?.id
      if (!paymentId) return new Response(JSON.stringify({ received: true }), { status: 200 })

      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? ""
      
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      })
      const paymentData = await mpResponse.json()
      
      if (mpResponse.ok && paymentData.status === "approved") {
         // Some subscriptions use 'external_reference' directly on payments.
         // If it's a sub payment, we just acknowledge it (the sub_preapproval webhook handles the main logic)
         console.log(`[MP Webhook] Payment ${paymentId} approved.`)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  } catch (error: any) {
    console.error("Webhook Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
