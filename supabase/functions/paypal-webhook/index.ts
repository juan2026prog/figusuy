import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { verifyPayPalWebhookSignature, PAYPAL_WEBHOOK_ID } from "../_shared/paypal.ts"

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  try {
    // 1. Verify Signature (Security) — OBLIGATORIO en producción
    if (!PAYPAL_WEBHOOK_ID) {
      console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set — REJECTING webhook. Configure this env var.')
      return new Response('Webhook not configured', { status: 503 })
    }

    const isValid = await verifyPayPalWebhookSignature(req, PAYPAL_WEBHOOK_ID)
    if (!isValid) {
      console.error('[PayPal Webhook] Invalid Signature')
      return new Response('Invalid signature', { status: 401 })
    }

    const body = await req.json()
    const eventType = body.event_type
    const resource = body.resource
    const providerEventId = body.id

    console.log(`[PayPal Webhook] Event: ${eventType} | ID: ${providerEventId}`)

    // 2. Audit Trail & Idempotency
    const { data: existingEvent } = await supabaseAdmin
      .from('subscription_events')
      .select('id, status')
      .eq('provider_event_id', providerEventId)
      .maybeSingle()

    if (existingEvent?.status === 'processed') {
      return new Response(JSON.stringify({ received: true, idempotency: 'ignored' }), { status: 200 })
    }

    const { data: auditEvent, error: auditError } = await supabaseAdmin
      .from('subscription_events')
      .upsert({
        provider_event_id: providerEventId,
        provider_subscription_id: resource.billing_agreement_id || resource.id,
        event_type: eventType,
        resource_type: body.resource_type,
        payload: body,
        status: 'pending'
      })
      .select()
      .single()

    if (auditError) throw auditError

    // 3. Extract Context
    const userId = resource.custom_id || resource.custom
    const providerSubscriptionId = resource.billing_agreement_id || resource.id

    // 4. Process Event
    let processingStatus = 'processed'
    let errorLog = null

    try {
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED': {
          const planId = resource.plan_id
          // Get internal plan info
          const { data: plan } = await supabaseAdmin
            .from('premium_plans')
            .select('name, plan_key, plan_family')
            .eq('paypal_plan_id', planId)
            .maybeSingle()

          const planKey = plan?.plan_key || 'plus'
          const planFamily = plan?.plan_family || 'user'

          await supabaseAdmin
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan_key: planKey,
              plan_family: planFamily,
              status: 'active',
              provider_subscription_id: providerSubscriptionId,
              current_period_end: resource.billing_info?.next_billing_time,
              metadata: { paypal_resource: resource }
            }, { onConflict: 'provider_subscription_id' })
          
          // Also sync to legacy profiles/subscriptions for backward compatibility
          await supabaseAdmin.from('profiles').update({ 
            is_premium: true, 
            plan_name: planKey // USAR EL KEY ('plus' o 'pro') para evitar errores de restricción
          }).eq('id', userId)
          
          break
        }

        case 'PAYMENT.SALE.COMPLETED': {
          const amount = parseFloat(resource.amount.total)
          const currency = resource.amount.currency
          
          // Identify user from subscription if not in resource
          let effectiveUserId = userId
          let subscriptionData = null
          
          if (!effectiveUserId && providerSubscriptionId) {
            const { data: sub } = await supabaseAdmin
              .from('user_subscriptions')
              .select('user_id, plan_key')
              .eq('provider_subscription_id', providerSubscriptionId)
              .maybeSingle()
            effectiveUserId = sub?.user_id
            subscriptionData = sub
          }

          if (effectiveUserId) {
            // A. Identify if this user was referred by an influencer
            const { data: conversion } = await supabaseAdmin
                .from('affiliate_conversions')
                .select('affiliate_id')
                .eq('user_id', effectiveUserId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (conversion?.affiliate_id) {
                // B. Obtener el user_id del influencer desde la tabla affiliates
                const { data: affiliateRecord } = await supabaseAdmin
                    .from('affiliates')
                    .select('id, user_id, tier')
                    .eq('id', conversion.affiliate_id)
                    .maybeSingle()

                if (!affiliateRecord?.user_id) {
                    console.error(`[PayPal Webhook] Affiliate ${conversion.affiliate_id} no tiene user_id asociado`)
                    break
                }

                const influencerUserId = affiliateRecord.user_id

                // C. Calcular comisión DINÁMICA basada en el tier del influencer
                let commissionRate = 0.15 // Default: 15%
                
                // Buscar configuración de comisión activa para este tier
                const { data: commissionConfig } = await supabaseAdmin
                    .from('affiliate_commissions')
                    .select('user_commission_rate')
                    .eq('affiliate_id', conversion.affiliate_id)
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (commissionConfig?.user_commission_rate) {
                    commissionRate = Number(commissionConfig.user_commission_rate) / 100
                } else {
                    // Fallback: usar tier para determinar comisión
                    const tierRates: Record<string, number> = {
                        'starter': 0.10,
                        'growth': 0.15,
                        'partner': 0.20,
                        'elite': 0.25,
                    }
                    commissionRate = tierRates[affiliateRecord.tier || 'starter'] || 0.15
                }

                const commissionAmount = amount * commissionRate
                
                console.log(`[PayPal Webhook] Commission: ${commissionRate * 100}% of ${amount} = ${commissionAmount} for affiliate ${conversion.affiliate_id} (user: ${influencerUserId})`)

                // D. Create Ledger Entry — USAR user_id DEL INFLUENCER (no affiliate_id)
                const { data: ledger } = await supabaseAdmin.from('financial_ledger').insert({
                  user_id: influencerUserId, // EL USER_ID DEL INFLUENCER (no el affiliate_id)
                  amount: commissionAmount,
                  currency: currency,
                  entry_type: 'commission',
                  reference_type: 'subscription',
                  reference_id: auditEvent.id,
                  description: `Comisión ${(commissionRate * 100).toFixed(0)}% por suscripción de usuario referido - Sub: ${providerSubscriptionId}`
                }).select().single()

                // E. Record detailed commission (affiliate_id references profiles.id)
                await supabaseAdmin.from('commissions').insert({
                    affiliate_id: influencerUserId, // FK a profiles(id) = user_id del influencer
                    source_user_id: effectiveUserId,
                    subscription_id: providerSubscriptionId,
                    amount: commissionAmount,
                    currency: currency,
                    status: 'payable',
                    plan_key: subscriptionData?.plan_key,
                    ledger_entry_id: ledger?.id
                })

                console.log(`[PayPal Webhook] Commission of ${commissionAmount} (${(commissionRate*100).toFixed(0)}%) credited to user ${influencerUserId} (affiliate ${conversion.affiliate_id})`)
            }
          }
          break
        }

        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.EXPIRED':
        case 'BILLING.SUBSCRIPTION.SUSPENDED': {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({ status: eventType.split('.').pop()?.toLowerCase() || 'cancelled' })
            .eq('provider_subscription_id', providerSubscriptionId)
          
          // Update legacy profile
          const { data: sub } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('provider_subscription_id', providerSubscriptionId)
            .single()
          
          if (sub?.user_id) {
            await supabaseAdmin.from('profiles').update({ 
                is_premium: false,
                plan_name: 'gratis'
            }).eq('id', sub.user_id)
          }
          break
        }

        default:
          console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`)
          processingStatus = 'ignored'
      }
    } catch (err) {
      console.error(`[PayPal Webhook] Processing Error:`, err)
      processingStatus = 'failed'
      errorLog = err.message
    }

    // 5. Update Audit Event
    await supabaseAdmin
      .from('subscription_events')
      .update({ status: processingStatus, error_log: errorLog, processed_at: new Date().toISOString() })
      .eq('id', auditEvent.id)

    return new Response(JSON.stringify({ received: true }), { status: 200 })

  } catch (error) {
    console.error('[PayPal Webhook] Global Error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
