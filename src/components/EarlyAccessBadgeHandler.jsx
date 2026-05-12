import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useAuthStore } from '../stores/authStore'
import { assignFoundingBadge, hasFoundingBadge } from '../services/earlyAccess'

const FoundingBadgeUnlockModal = lazy(() => import('./FoundingBadgeUnlockModal'))

const EA_CHECKED_KEY = 'figusuy.early_access_checked'
const EA_UNLOCK_SHOWN_KEY = 'figusuy.early_access_unlock_shown'

/**
 * EarlyAccessBadgeHandler
 * 
 * Mounted inside AppChrome for authenticated users.
 * On first login/profile creation, checks eligibility and:
 * 1. Assigns the founding badge if eligible
 * 2. Shows the unlock animation
 * 
 * Only runs once per user session. No-ops if already checked.
 */
export default function EarlyAccessBadgeHandler() {
  const user = useAuthStore(state => state.user)
  const profile = useAuthStore(state => state.profile)
  const [showUnlock, setShowUnlock] = useState(false)
  const [proDays, setProDays] = useState(7)

  useEffect(() => {
    if (!user?.id || !profile?.id) return

    // Only run once per session per user
    const checkedKey = `${EA_CHECKED_KEY}:${user.id}`
    if (sessionStorage.getItem(checkedKey)) return

    // Mark as checked immediately to prevent double runs
    sessionStorage.setItem(checkedKey, '1')

    const run = async () => {
      try {
        // Check if user already has the badge
        const alreadyHas = await hasFoundingBadge(user.id)
        
        if (alreadyHas) {
          // Check if we've shown the unlock animation for this user before
          const unlockShownKey = `${EA_UNLOCK_SHOWN_KEY}:${user.id}`
          const alreadyShown = localStorage.getItem(unlockShownKey)
          if (alreadyShown) return

          // First time seeing the badge (they got it but haven't seen animation yet)
          // This could happen if they had it from a prior seed or manual grant
          localStorage.setItem(unlockShownKey, '1')
          setShowUnlock(true)
          return
        }

        // Try to assign the badge
        const result = await assignFoundingBadge(user.id)

        if (result?.success) {
          setProDays(result.pro_days || 7)
          
          // Mark as shown
          const unlockShownKey = `${EA_UNLOCK_SHOWN_KEY}:${user.id}`
          localStorage.setItem(unlockShownKey, '1')

          // Re-sync profile to get updated premium status
          try {
            const { syncSession } = useAuthStore.getState()
            const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
            if (session) {
              await syncSession(session, { touchLastActive: false })
            }
          } catch (syncErr) {
            console.warn('[EarlyAccess] Profile re-sync failed:', syncErr)
          }

          // Show the unlock animation
          setShowUnlock(true)

          // Trigger email notification for the badge unlock
          try {
            const { supabase } = await import('../lib/supabase')
            await supabase.functions.invoke('email-lifecycle', {
              body: {
                action: 'trigger_event',
                event: 'achievement_unlocked',
                email: user.email,
                variables: {
                  name: profile.full_name || user.email,
                  achievement_name: 'Medalla de Fundador',
                  badge_key: 'desde_el_comienzo',
                  pro_days: result.pro_days || 7
                }
              }
            })
          } catch (emailErr) {
            console.warn('[EarlyAccess] Email notification failed:', emailErr)
          }
        }
      } catch (err) {
        console.error('[EarlyAccessBadgeHandler] Error:', err)
      }
    }

    run()
  }, [user?.id, profile?.id])

  const handleUnlockClose = useCallback(() => {
    setShowUnlock(false)
  }, [])

  return (
    <Suspense fallback={null}>
      <FoundingBadgeUnlockModal
        isOpen={showUnlock}
        onClose={handleUnlockClose}
        proDays={proDays}
      />
    </Suspense>
  )
}
