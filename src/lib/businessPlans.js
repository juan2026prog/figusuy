export const BUSINESS_PLAN_ORDER = ['gratis', 'turbo', 'dominio', 'legend']

export const BUSINESS_PLAN_LABELS = {
  gratis: 'Plan Gratis',
  turbo: 'Plan Turbo',
  dominio: 'Plan Dominio',
  legend: 'PartnerStore'
}

export const LOCAL_BUSINESS_PLAN_RULES = {
  gratis: {
    plan_name: 'gratis',
    monthly_price: 0,
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
    monthly_price: 1490,
    max_photos: 3,
    max_active_promos: null
  },
  legend: {
    plan_name: 'legend',
    monthly_price: 1900,
    max_photos: 3,
    max_active_promos: null
  }
}

export function getBusinessPlanLabel(planName) {
  return BUSINESS_PLAN_LABELS[planName] || 'Plan Gratis'
}

export function getLocalBusinessPlanRules(planName) {
  return LOCAL_BUSINESS_PLAN_RULES[planName] || LOCAL_BUSINESS_PLAN_RULES.gratis
}

export function isBusinessPlanAtLeast(currentPlan, targetPlan) {
  return BUSINESS_PLAN_ORDER.indexOf(currentPlan) >= BUSINESS_PLAN_ORDER.indexOf(targetPlan)
}
