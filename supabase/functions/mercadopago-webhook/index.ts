import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Variables de entorno necesarias:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
// - MERCADOPAGO_ACCESS_TOKEN

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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

    // Solo nos interesa cuando una suscripción preapproval es creada o actualizada,
    // o cuando un pago (payment) es aprobado.
    if (topic === 'payment') {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')}`
        }
      })
      const payment = await response.json()

      if (payment.status === 'approved' && payment.external_reference) {
        const userId = payment.external_reference
        
        // Inferir plan por el monto (99 = plus, 199 = pro)
        let planAssigned = 'plus'
        if (payment.transaction_amount >= 199) planAssigned = 'pro'

        await supabaseAdmin
          .from('profiles')
          .update({ is_premium: true, plan_name: planAssigned })
          .eq('id', userId)
          
        await supabaseAdmin.from('audit_log').insert({
          module: 'monetization',
          action: 'subscription_payment',
          target_id: userId,
          changer_id: null,
          new_value: { payment_id: payment.id, amount: payment.transaction_amount, plan: planAssigned }
        })
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
