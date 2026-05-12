/**
 * Early Access Service
 * Handles founding badge assignment and early access stats.
 */
import { supabase } from '../lib/supabase'

const EARLY_ACCESS_LIMIT = 250
const BADGE_KEY = 'desde_el_comienzo'

/**
 * Fetch current early access stats (total profiles, slots remaining, etc.)
 */
export async function getEarlyAccessStats() {
  try {
    const { data, error } = await supabase.rpc('get_early_access_stats')
    if (error) throw error
    return data
  } catch (err) {
    console.error('[EarlyAccess] Stats fetch error:', err)
    // Fallback: query directly
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    return {
      total_profiles: count || 0,
      limit: EARLY_ACCESS_LIMIT,
      slots_remaining: Math.max(0, EARLY_ACCESS_LIMIT - (count || 0)),
    }
  }
}

/**
 * Atomically assign founding badge + 7 days PRO to a user.
 * Called after profile creation. Returns result object.
 */
export async function assignFoundingBadge(userId) {
  if (!userId) return { success: false, reason: 'no_user_id' }

  try {
    const { data, error } = await supabase.rpc('assign_founding_badge', {
      p_user_id: userId,
    })
    if (error) throw error
    return data
  } catch (err) {
    console.error('[EarlyAccess] Badge assignment error:', err)
    return { success: false, reason: 'error', message: err.message }
  }
}

/**
 * Check if a user already has the founding badge.
 */
export async function hasFoundingBadge(userId) {
  if (!userId) return false
  try {
    const { data } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_key', BADGE_KEY)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}
