import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { corsHeaders, handleOptions } from "../_shared/cors.ts"

serve(async (req: Request) => {
  const options = handleOptions(req)
  if (options) return options

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const mpAccessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''

    if (!mpAccessToken) throw new Error('Mercado Pago Access Token no configurado en variables de entorno.')

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
    const { planId } = await req.json()

    // 1. Get the authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No autorizado')
    
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Usuario no encontrado o sesión expirada')

    // 2. Fetch the plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) throw new Error('Plan no encontrado')

    // 3. Create a pending order in our database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('plan_orders')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency || 'UYU',
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) throw new Error(`Error al crear la orden: ${orderError.message}`)

    // 4. Create Mercado Pago Preapproval (Subscription)
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const isSandbox = mpAccessToken.startsWith('TEST-')
    // Nota: Para suscripciones (preapproval), Mercado Pago a veces usa la URL base en el init_point
    // y no provee un sandbox_init_point directamente en la misma estructura.
    
    const preapprovalPayload = {
      reason: `Plan ${plan.name} - FigusUy`,
      external_reference: order.id,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(plan.price),
        currency_id: plan.currency || "UYU"
      },
      back_url: `${origin}/profile?payment=success&order_id=${order.id}`,
      status: "pending"
    }

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preapprovalPayload),
    })

    const mpResult = await mpResponse.json()
    if (!mpResponse.ok) throw new Error(`Error de Mercado Pago Subscriptions: ${JSON.stringify(mpResult)}`)

    // 5. Update order with subscription ID
    await supabaseAdmin
      .from('plan_orders')
      .update({ payment_id: mpResult.id })
      .eq('id', order.id)

    // Mercado Pago Preapproval returns init_point
    const checkoutUrl = mpResult.init_point

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    console.error('Checkout Error:', err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
