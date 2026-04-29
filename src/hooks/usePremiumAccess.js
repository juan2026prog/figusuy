import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Central hook for premium access checks.
 * Reads from app_settings to check if premium is free for everyone,
 * free for N days since registration, or normal paid mode.
 * 
 * Returns { isPremium, planName, reason }
 *   - isPremium: boolean — whether the user has premium access
 *   - planName: string — the user's actual plan name
 *   - reason: string — 'paid' | 'free_mode' | 'free_trial' | 'none'
 */

let _cachedFreeMode = null
let _cachedFreeDays = null
let _cacheTime = 0

export function usePremiumAccess() {
  const { profile } = useAuthStore()
  const [freeMode, setFreeMode] = useState(_cachedFreeMode)
  const [freeDays, setFreeDays] = useState(_cachedFreeDays)

  useEffect(() => {
    // Cache for 60 seconds to avoid spamming the DB
    if (_cachedFreeMode !== null && Date.now() - _cacheTime < 60000) {
      setFreeMode(_cachedFreeMode)
      setFreeDays(_cachedFreeDays)
      return
    }

    const load = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['premium_free_mode', 'premium_free_days'])

      let mode = 'disabled'
      let days = 7

      ;(data || []).forEach(s => {
        const val = typeof s.value === 'string' ? s.value.replace(/"/g, '') : s.value
        if (s.key === 'premium_free_mode') mode = val || 'disabled'
        if (s.key === 'premium_free_days') days = Number(val) || 7
      })

      _cachedFreeMode = mode
      _cachedFreeDays = days
      _cacheTime = Date.now()
      setFreeMode(mode)
      setFreeDays(days)
    }
    load()
  }, [])

  const actualPlanName = profile?.plan_name || 'gratis'
  const actualIsPremium = profile?.is_premium === true || (actualPlanName !== 'gratis')

  // If user is already premium by payment, always true
  if (actualIsPremium) {
    return { isPremium: true, planName: actualPlanName, reason: 'paid' }
  }

  // Check free mode
  if (freeMode === 'everyone') {
    return { isPremium: true, planName: 'pro', reason: 'free_mode' }
  }

  if (freeMode === 'days' && freeDays > 0 && profile?.created_at) {
    const registeredAt = new Date(profile.created_at)
    const now = new Date()
    const daysSinceRegistration = (now - registeredAt) / (1000 * 60 * 60 * 24)
    if (daysSinceRegistration <= freeDays) {
      return { isPremium: true, planName: 'pro', reason: 'free_trial' }
    }
  }

  return { isPremium: false, planName: 'gratis', reason: 'none' }
}
