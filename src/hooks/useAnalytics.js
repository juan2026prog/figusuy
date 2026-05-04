import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useLocation } from 'react-router-dom'

export function useAnalytics() {
  const { user } = useAuthStore()
  const location = useLocation()

  const getSessionId = () => {
    const existing = localStorage.getItem('session_id')
    if (existing) return existing
    const next = crypto.randomUUID()
    localStorage.setItem('session_id', next)
    return next
  }

  const trackEvent = async (eventName, properties = {}) => {
    try {
      await supabase.from('user_events').insert({
        user_id: user?.id || null,
        session_id: getSessionId(),
        event: eventName,
        page: location.pathname,
        properties
      })
    } catch (err) {
      console.warn('Analytics error:', err)
    }
  }

  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, search: location.search })
  }, [location.pathname, location.search, user?.id])

  return { trackEvent }
}
