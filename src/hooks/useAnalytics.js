import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { useLocation } from 'react-router-dom'

export function useAnalytics() {
  const { user } = useAuthStore()
  const location = useLocation()

  // Track page views automatically when the location changes
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname, search: location.search })
  }, [location.pathname, location.search, user?.id])

  const trackEvent = async (eventName, properties = {}) => {
    try {
      if (!user) return // Don't track if not logged in (or you can use a session ID)
      
      const session_id = localStorage.getItem('session_id') || crypto.randomUUID()
      if (!localStorage.getItem('session_id')) {
        localStorage.setItem('session_id', session_id)
      }

      await supabase.from('user_events').insert({
        user_id: user.id,
        session_id: session_id,
        event: eventName,
        page: location.pathname,
        properties: properties
      })
    } catch (err) {
      console.warn('Analytics error:', err)
    }
  }

  return { trackEvent }
}
