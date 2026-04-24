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

    // 4. Create Mercado Pago Preference
    const origin = req.headers.get('origin') || 'http://localhost:5173'
    const isSandbox = mpAccessToken.startsWith('TEST-')
    const webhookUrl = `${supabaseUrl}/functions/v1/mercadopago-webhook`

    const preferencePayload = {
      items: [
        {
          id: plan.id,
          title: `Plan ${plan.name} - FigusUy`,
          quantity: 1,
          unit_price: Number(plan.price),
          currency_id: plan.currency || 'UYU',
        }
      ],
      payer: {
        email: user.email,
      },
      back_urls: {
        success: `${origin}/profile?payment=success&order_id=${order.id}`,
        failure: `${origin}/premium?payment=failure`,
        pending: `${origin}/profile?payment=pending`,
      },
      auto_return: 'approved',
      external_reference: order.id,
      notification_url: webhookUrl,
      statement_descriptor: 'FIGUSUY PREMIUM',
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(preferencePayload),
    })

    const mpResult = await mpResponse.json()
    if (!mpResponse.ok) throw new Error(`Error de Mercado Pago: ${JSON.stringify(mpResult)}`)

    // 5. Update order with preference ID
    await supabaseAdmin
      .from('plan_orders')
      .update({ payment_id: mpResult.id })
      .eq('id', order.id)

    const checkoutUrl = isSandbox ? mpResult.sandbox_init_point : mpResult.init_point

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
