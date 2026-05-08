import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useBusinessPlanStore = create((set) => ({
  plans: [],
  userPlans: [],
  loading: false,
  error: null,

  fetchPlans: async () => {
    set({ loading: true, error: null })
    try {
      // Fetch Business Plans
      const { data: bData, error: bError } = await supabase
        .from('business_plan_rules')
        .select('*')
        .order('monthly_price', { ascending: true })

      if (bError) throw bError

      // Fetch User Plans
      const { data: uData, error: uError } = await supabase
        .from('premium_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (uError) throw uError

      set({ 
        plans: bData || [], 
        userPlans: uData || [],
        loading: false 
      })
    } catch (err) {
      console.error('Error fetching plans:', err)
      set({ error: err.message, loading: false })
    }
  }
}))
