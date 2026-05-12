/**
 * useEarlyAccessEligibility
 * 
 * Hook to determine if the Early Access popup should be shown,
 * and to track early access stats + user eligibility.
 */
import { useState, useEffect, useCallback } from 'react'
import { getEarlyAccessStats } from '../services/earlyAccess'

const EA_DISMISSED_KEY = 'figusuy.early_access_dismissed'
const EA_DISMISSED_SESSION_KEY = 'figusuy.early_access_dismissed_session'

export function useEarlyAccessEligibility({ user = null, enabled = true } = {}) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  // Check if user already dismissed (persistent or session)
  useEffect(() => {
    try {
      const persistDismissed = localStorage.getItem(EA_DISMISSED_KEY)
      const sessionDismissed = sessionStorage.getItem(EA_DISMISSED_SESSION_KEY)
      if (persistDismissed || sessionDismissed) {
        setDismissed(true)
      }
    } catch { /* ignore */ }
  }, [])

  // Fetch stats
  useEffect(() => {
    if (!enabled || dismissed) {
      setLoading(false)
      return
    }

    let cancelled = false
    const load = async () => {
      try {
        const data = await getEarlyAccessStats()
        if (!cancelled) setStats(data)
      } catch (err) {
        console.error('[useEarlyAccessEligibility]', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [enabled, dismissed])

  // Determine if popup should show
  const slotsRemaining = stats?.slots_remaining ?? 250
  const isEarlyAccessOpen = slotsRemaining > 0

  // Popup should show if: no user logged in, not dismissed, early access still open
  const shouldShowPopup = !user && !dismissed && isEarlyAccessOpen && !loading

  const dismissTemporarily = useCallback(() => {
    setDismissed(true)
    try {
      sessionStorage.setItem(EA_DISMISSED_SESSION_KEY, '1')
    } catch { /* ignore */ }
  }, [])

  const dismissPermanently = useCallback(() => {
    setDismissed(true)
    try {
      localStorage.setItem(EA_DISMISSED_KEY, '1')
    } catch { /* ignore */ }
  }, [])

  return {
    stats,
    loading,
    shouldShowPopup,
    isEarlyAccessOpen,
    slotsRemaining,
    dismissTemporarily,
    dismissPermanently,
  }
}
