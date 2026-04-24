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

    // Only handle payment notifications
    if (body.type === "payment" && (body.action === "payment.created" || body.action === "payment.updated")) {
      const paymentId = body.data.id
      
      const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? ""
      
      if (!mpAccessToken) throw new Error("Mercado Pago Access Token no configurado.")

      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

      // 1. Verify payment status with MP
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { "Authorization": `Bearer ${mpAccessToken}` }
      })
      const paymentData = await mpResponse.json()
      
      if (!mpResponse.ok) throw new Error(`Fetch failed from MP: ${JSON.stringify(paymentData)}`)
      
      const orderId = paymentData.external_reference
      if (!orderId) {
        console.warn("[MP Webhook] No external_reference (Order ID) found.")
        return new Response(JSON.stringify({ received: true }), { status: 200 })
      }

      // 2. Fetch the order
      const { data: order, error: orderError } = await supabaseAdmin
        .from('plan_orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) throw new Error(`Orden ${orderId} no encontrada.`)

      // 3. If APPROVED, upgrade user to Premium
      if (paymentData.status === "approved" || paymentData.status === "authorized") {
        if (order.status !== 'paid') {
          console.log(`[MP Webhook] Marking Order ${orderId} as PAID and upgrading user ${order.user_id}`)
          
          // Update Order
          await supabaseAdmin
            .from("plan_orders")
            .update({ 
              status: "paid", 
              payment_id: paymentId.toString(),
              updated_at: new Date().toISOString()
            })
            .eq("id", orderId)

          // Upgrade User Profile
          await supabaseAdmin
            .from("profiles")
            .update({ 
              is_premium: true,
              premium_plan_id: order.plan_id,
              last_active: new Date().toISOString() // Optional: update activity
            })
            .eq("id", order.user_id)
            
          console.log(`[MP Webhook] User ${order.user_id} is now PREMIUM!`)
        }
      } 
      // CANCELLED or REJECTED STATUS
      else if (paymentData.status === "cancelled" || paymentData.status === "rejected") {
        await supabaseAdmin
          .from("plan_orders")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", orderId)
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
