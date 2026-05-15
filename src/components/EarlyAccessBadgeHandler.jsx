import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useAuthStore } from '../stores/authStore'

const FoundingBadgeUnlockModal = lazy(() => import('./FoundingBadgeUnlockModal'))

const EA_UNLOCK_SHOWN_KEY = 'foundingBadgeSeen'

/**
 * EarlyAccessBadgeHandler
 * 
 * Mounted inside AppChrome for authenticated users.
 * Checks if the user is a founding member and shows the cinematic unlock animation exactly once.
 */
export default function EarlyAccessBadgeHandler() {
  const user = useAuthStore(state => state.user)
  const profile = useAuthStore(state => state.profile)
  const [showUnlock, setShowUnlock] = useState(false)

  useEffect(() => {
    if (!user?.id || !profile?.id || typeof window === 'undefined') return

    const isFoundingMember = profile.founding_member === true
    const alreadyShown = window.localStorage.getItem(EA_UNLOCK_SHOWN_KEY) === 'true'

    setShowUnlock(isFoundingMember && !alreadyShown)
  }, [user?.id, profile?.founding_member, profile?.id])

  const handleUnlockClose = useCallback(() => {
    setShowUnlock(false)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EA_UNLOCK_SHOWN_KEY, 'true')
    }
  }, [])

  if (!showUnlock) return null

  return (
    <Suspense fallback={null}>
      <FoundingBadgeUnlockModal
        isOpen={showUnlock}
        onClose={handleUnlockClose}
        proDays={7}
      />
    </Suspense>
  )
}
