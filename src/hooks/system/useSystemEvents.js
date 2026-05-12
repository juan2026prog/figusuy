import { useSystemStore } from '../../stores/system/useSystemStore';

export const useSystemEvents = () => {
  const { enqueueEvent } = useSystemStore();

  const dispatchEvent = (type, data = {}, priority = 'normal') => {
    enqueueEvent({
      id: crypto.randomUUID(),
      type,
      data,
      priority,
      timestamp: Date.now()
    });
  };

  return {
    dispatchEvent,
    
    // Convenience methods
    triggerMatchFound: (data) => dispatchEvent('MATCH_FOUND', data, 'high'),
    triggerMatchDetail: (data) => dispatchEvent('MATCH_DETAIL', data, 'high'),
    triggerTradeConfirmed: (data) => dispatchEvent('TRADE_CONFIRMED', data, 'high'),
    triggerFirstTrade: (data) => dispatchEvent('FIRST_TRADE', data),
    triggerBadgeUnlocked: (data) => dispatchEvent('BADGE_UNLOCKED', data),
    triggerLevelUp: (data) => dispatchEvent('LEVEL_UP', data, 'high'),
    triggerFoundingMember: (data) => dispatchEvent('FOUNDING_MEMBER', data),
    triggerFoundingHub: (data) => dispatchEvent('FOUNDING_HUB', data),
    triggerCollectorHubVerified: (data) => dispatchEvent('COLLECTOR_HUB_VERIFIED', data),
    triggerAlbumCompleted: (data) => dispatchEvent('ALBUM_COMPLETED', data),
    triggerNewActiveLocation: (data) => dispatchEvent('NEW_ACTIVE_LOCATION', data),
    triggerPlanUpgraded: (data) => dispatchEvent('PLAN_UPGRADED', data, 'high'),
    triggerPlusActivated: (data) => dispatchEvent('PLUS_ACTIVATED', data),
    triggerProActivated: (data) => dispatchEvent('PRO_ACTIVATED', data),
    triggerReferralCompleted: (data) => dispatchEvent('REFERRAL_COMPLETED', data)
  };
};
