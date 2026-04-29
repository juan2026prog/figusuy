import { create } from 'zustand'
import { supabase } from '../lib/supabase'

/**
 * Feature Flag Store
 * 
 * Provides:
 * - isFeatureEnabled(key) → boolean (frontend gating)
 * - fetchFlags() → load all flags from DB
 * - fetchFlagsStatus(userId) → bulk-check via RPC
 * - Admin CRUD operations for God Admin panel
 * - Emergency kill/restore
 * - Audit log
 */
export const useFeatureFlagStore = create((set, get) => ({
  // State
  flags: [],
  flagsStatus: {},  // { feature_key: boolean } resolved map
  auditLog: [],
  loading: false,
  lastFetch: null,

  // ========== FRONTEND HELPERS ==========

  /**
   * Check if a feature is enabled for the current user.
   * Uses the pre-fetched flagsStatus map for instant lookups.
   * Falls back to raw flag check if status not loaded.
   */
  isFeatureEnabled: (featureKey) => {
    const { flagsStatus, flags } = get()

    // Check resolved status first (includes user-specific gating)
    if (flagsStatus && typeof flagsStatus[featureKey] === 'boolean') {
      return flagsStatus[featureKey]
    }

    // Fallback: check raw flags
    const flag = flags.find(f => f.feature_key === featureKey)
    if (!flag) return true // Unknown flags default to enabled (safe fallback)

    if (flag.kill_switch) return false
    if (!flag.is_enabled) return false

    return true
  },

  // ========== DATA FETCHING ==========

  /**
   * Fetch all feature flags from database.
   * Used for both admin management and frontend gating.
   */
  fetchFlags: async () => {
    set({ loading: true })
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('scope')
      .order('name')

    if (!error) {
      set({ flags: data || [], lastFetch: Date.now(), loading: false })
    } else {
      console.error('Error fetching feature flags:', error)
      set({ loading: false })
    }
  },

  /**
   * Fetch resolved flag status for a specific user via RPC.
   * This checks all gating conditions server-side.
   */
  fetchFlagsStatus: async (userId = null) => {
    const { data, error } = await supabase.rpc('get_feature_flags_status', {
      p_user_id: userId
    })

    if (!error && data) {
      set({ flagsStatus: data })
    }
  },

  /**
   * Initialize flags for the current user session.
   * Call this on app startup.
   */
  initializeFlags: async (userId = null) => {
    await get().fetchFlags()
    await get().fetchFlagsStatus(userId)
  },

  // ========== ADMIN OPERATIONS ==========

  /**
   * Toggle a feature flag on/off.
   */
  toggleFlag: async (featureKey, enabled, adminId, reason = '') => {
    const flag = get().flags.find(f => f.feature_key === featureKey)
    if (!flag) return

    const { error } = await supabase
      .from('feature_flags')
      .update({
        is_enabled: enabled,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('feature_key', featureKey)

    if (!error) {
      // Log audit
      await supabase.from('feature_flag_audit').insert({
        feature_key: featureKey,
        action: enabled ? 'enable' : 'disable',
        changed_by: adminId,
        old_value: { is_enabled: flag.is_enabled },
        new_value: { is_enabled: enabled },
        reason
      })

      // Also log to main audit_log
      await supabase.from('audit_log').insert({
        user_id: adminId,
        action: enabled ? 'ENABLE_FEATURE' : 'DISABLE_FEATURE',
        entity_type: 'feature_flag',
        entity_id: flag.id,
        details: { feature_key: featureKey, reason }
      })

      get().fetchFlags()
    }
    return error
  },

  /**
   * Toggle kill switch for a single flag.
   */
  toggleKillSwitch: async (featureKey, killState, adminId, reason = '') => {
    const flag = get().flags.find(f => f.feature_key === featureKey)
    if (!flag) return

    const { error } = await supabase
      .from('feature_flags')
      .update({
        kill_switch: killState,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('feature_key', featureKey)

    if (!error) {
      await supabase.from('feature_flag_audit').insert({
        feature_key: featureKey,
        action: killState ? 'kill_switch_on' : 'kill_switch_off',
        changed_by: adminId,
        old_value: { kill_switch: flag.kill_switch },
        new_value: { kill_switch: killState },
        reason
      })

      get().fetchFlags()
    }
    return error
  },

  /**
   * Update a feature flag's configuration.
   */
  updateFlag: async (featureKey, updates, adminId, reason = '') => {
    const flag = get().flags.find(f => f.feature_key === featureKey)
    if (!flag) return

    const { error } = await supabase
      .from('feature_flags')
      .update({
        ...updates,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('feature_key', featureKey)

    if (!error) {
      await supabase.from('feature_flag_audit').insert({
        feature_key: featureKey,
        action: 'update',
        changed_by: adminId,
        old_value: {
          is_enabled: flag.is_enabled,
          scope: flag.scope,
          beta_only: flag.beta_only,
          rollout_percentage: flag.rollout_percentage,
          allowed_plans: flag.allowed_plans,
          allowed_roles: flag.allowed_roles,
          kill_switch: flag.kill_switch
        },
        new_value: updates,
        reason
      })

      await supabase.from('audit_log').insert({
        user_id: adminId,
        action: 'UPDATE_FEATURE_FLAG',
        entity_type: 'feature_flag',
        entity_id: flag.id,
        details: { feature_key: featureKey, updates, reason }
      })

      get().fetchFlags()
    }
    return error
  },

  /**
   * Update rollout percentage.
   */
  updateRollout: async (featureKey, percentage, adminId, reason = '') => {
    const flag = get().flags.find(f => f.feature_key === featureKey)
    if (!flag) return

    const { error } = await supabase
      .from('feature_flags')
      .update({
        rollout_percentage: percentage,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      })
      .eq('feature_key', featureKey)

    if (!error) {
      await supabase.from('feature_flag_audit').insert({
        feature_key: featureKey,
        action: 'rollout_change',
        changed_by: adminId,
        old_value: { rollout_percentage: flag.rollout_percentage },
        new_value: { rollout_percentage: percentage },
        reason
      })

      get().fetchFlags()
    }
    return error
  },

  // ========== EMERGENCY CONTROLS ==========

  /**
   * Emergency kill ALL features.
   */
  emergencyKillAll: async () => {
    const { error } = await supabase.rpc('emergency_kill_all_features')
    if (!error) get().fetchFlags()
    return error
  },

  /**
   * Restore ALL features from emergency kill.
   */
  restoreAll: async () => {
    const { error } = await supabase.rpc('restore_all_features')
    if (!error) get().fetchFlags()
    return error
  },

  // ========== AUDIT LOG ==========

  /**
   * Fetch audit log for feature flags.
   */
  fetchAuditLog: async (featureKey = null) => {
    let query = supabase
      .from('feature_flag_audit')
      .select('*, changer:changed_by(name, email)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (featureKey) {
      query = query.eq('feature_key', featureKey)
    }

    const { data } = await query
    set({ auditLog: data || [] })
  },
}))

/**
 * Standalone helper function for use outside React components.
 * Import this directly in any module.
 */
export function isFeatureEnabled(featureKey) {
  return useFeatureFlagStore.getState().isFeatureEnabled(featureKey)
}
