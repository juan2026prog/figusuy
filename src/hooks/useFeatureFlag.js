import { useFeatureFlagStore } from '../stores/featureFlagStore'

/**
 * React hook to check if a feature is enabled.
 * 
 * Usage:
 *   const isEnabled = useFeatureFlag('chats')
 *   if (!isEnabled) return <FeatureDisabled />
 */
export function useFeatureFlag(featureKey) {
  return useFeatureFlagStore(state => state.isFeatureEnabled(featureKey))
}

/**
 * Check multiple feature flags at once.
 * 
 * Usage:
 *   const { chats, premium, matches } = useMultipleFeatureFlags(['chats', 'premium', 'matches'])
 */
export function useMultipleFeatureFlags(featureKeys) {
  const isFeatureEnabled = useFeatureFlagStore(state => state.isFeatureEnabled)
  const result = {}
  featureKeys.forEach(key => {
    result[key] = isFeatureEnabled(key)
  })
  return result
}

/**
 * Declarative feature gate component.
 * 
 * Usage:
 *   <FeatureGate feature="premium" fallback={<UpgradePrompt />}>
 *     <PremiumContent />
 *   </FeatureGate>
 */
export function FeatureGate({ feature, children, fallback = null }) {
  const isEnabled = useFeatureFlag(feature)
  return isEnabled ? children : fallback
}
