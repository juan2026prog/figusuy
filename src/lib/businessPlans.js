export const BUSINESS_PLAN_ORDER = ['gratis', 'turbo', 'dominio', 'partner_store']

export const BUSINESS_PLAN_LABELS = {
  gratis: 'Plan Gratis',
  turbo: 'Plan Radar',
  dominio: 'Plan Conversion',
  partner_store: 'Plan Collector Hub'
}

export const LOCAL_BUSINESS_PLAN_RULES = {
  gratis: {
    plan_name: 'gratis',
    monthly_price: 590,
    max_photos: 0,
    max_active_promos: 0
  },
  turbo: {
    plan_name: 'turbo',
    monthly_price: 690,
    max_photos: 1,
    max_active_promos: 1
  },
  dominio: {
    plan_name: 'dominio',
    monthly_price: 1320,
    max_photos: 3,
    max_active_promos: null
  },
  partner_store: {
    plan_name: 'partner_store',
    monthly_price: 2990,
    max_photos: 10,
    max_active_promos: null
  }
}

export function getBusinessPlanLabel(planName) {
  return BUSINESS_PLAN_LABELS[planName] || 'Plan Boost'
}

export function getLocalBusinessPlanRules(planName) {
  return LOCAL_BUSINESS_PLAN_RULES[planName] || LOCAL_BUSINESS_PLAN_RULES.gratis
}

export function isBusinessPlanAtLeast(currentPlan, targetPlan) {
  return BUSINESS_PLAN_ORDER.indexOf(currentPlan) >= BUSINESS_PLAN_ORDER.indexOf(targetPlan)
}
