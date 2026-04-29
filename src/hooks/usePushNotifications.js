import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function usePushNotifications() {
  const { user } = useAuthStore()
  const [permission, setPermission] = useState('default')
  
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return false
    
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted' && user) {
        // En una implementación real de PWA, aquí registraríamos el Service Worker
        // y usaríamos pushManager.subscribe() para obtener el token real.
        // Simularemos el guardado de un token temporal para el Notification Agent
        const dummyToken = 'push_token_' + crypto.randomUUID()
        
        await supabase.from('profiles').update({
          push_token: dummyToken,
          notifications_enabled: true
        }).eq('id', user.id)

        // Registrar en Analytics
        await supabase.from('user_events').insert({
          user_id: user.id,
          session_id: localStorage.getItem('session_id') || crypto.randomUUID(),
          event: 'push_granted',
          page: window.location.pathname,
          properties: { timestamp: new Date().toISOString() }
        })
      }
      return result === 'granted'
    } catch (err) {
      console.error('Error requesting push permission:', err)
      return false
    }
  }

  return { permission, requestPermission }
}
