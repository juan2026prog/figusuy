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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    const { planId } = await req.json()
    if (!planId) throw new Error('Missing planId')

    // Log for debugging
    console.log('Fetching plan from DB with ID:', planId)
    const { data: plan, error: planError } = await supabaseClient
      .from('premium_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) throw new Error('Plan not found')
    
    // Sanitize ID (remove any accidental whitespace)
    const paypalPlanId = plan.paypal_plan_id?.trim()
    console.log(`Verifying PayPal Plan ID: [${paypalPlanId}] for plan: ${plan.name}`)
    
    if (!paypalPlanId) throw new Error('This plan is not configured for PayPal')

    // 2. Get PayPal Token
    const accessToken = await getPayPalAccessToken()

    // 3. Pre-flight check: Try to fetch plan details to verify existence
    const verifyResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/plans/${paypalPlanId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.json()
      console.error('PayPal Plan Verification Failed:', verifyError)
      throw new Error(`PayPal Error: El Plan ID [${paypalPlanId}] no fue encontrado en tu cuenta de PayPal (${verifyError.name})`)
    }

    // 4. Create Subscription
    const origin = req.headers.get('origin') || 'https://figusuy.com'
    
    // Log for debugging
    console.log('Creating subscription for plan:', plan.paypal_plan_id, 'User:', user.email)

    const subResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        plan_id: plan.paypal_plan_id,
        application_context: {
          brand_name: "FigusUy",
          locale: "es-ES",
          shipping_preference: "NO_SHIPPING",
          user_action: "SUBSCRIBE_NOW",
          return_url: `${origin}/premium?status=success`,
          cancel_url: `${origin}/premium?status=cancel`
        },
        custom_id: user.id,
        subscriber: {
          email_address: user.email || 'usuario@figusuy.com' // Fallback por si no hay email
        }
      })
    })

    if (!subResponse.ok) {
      const errData = await subResponse.json()
      console.error('PayPal Subscription Error:', errData)
      throw new Error(`PayPal Error: ${errData.message || 'Failed to create subscription'} (${errData.name || 'Unknown'})`)
    }

    const subscription = await subResponse.json()
    const checkout_url = subscription.links.find((l: any) => l.rel === 'approve')?.href

    if (!checkout_url) throw new Error('Checkout URL not generated')

    return new Response(JSON.stringify({ checkout_url, subscription_id: subscription.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
