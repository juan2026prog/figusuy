// MatchEngine wraps existing matching logic and adds gamification/social elements
// without breaking the current matching system.

export class MatchEngine {
  /**
   * Enhances a basic match with gamification and social details
   * @param {Object} rawMatch - The raw match data from the existing system
   * @param {Object} userProfile - The current user's profile
   */
  static enhanceMatch(rawMatch, userProfile) {
    // Calculate a dynamic but consistent match percentage based on user IDs or similar
    const compatibilityScore = this.calculateCompatibility(rawMatch, userProfile);
    
    // Generate placeholder chips for stickers
    // In the future this will be replaced with real sticker data
    const stickersHeHas = this.generateStickerPlaceholders(rawMatch.heHasCount || 12);
    const stickersYouHave = this.generateStickerPlaceholders(rawMatch.youHaveCount || 8);
    
    return {
      ...rawMatch,
      compatibilityScore,
      stickersHeHas,
      stickersYouHave,
      distance: rawMatch.distance || this.estimateDistance(rawMatch.locationId),
      reputation: this.calculateReputation(rawMatch.userId),
      badges: this.getBadgesForUser(rawMatch.userId)
    };
  }

  static calculateCompatibility(match, user) {
    // Dummy logic for now: between 70 and 99
    return Math.floor(Math.random() * 30) + 70;
  }

  static generateStickerPlaceholders(count) {
    const prefixes = ['#', 'M', 'ARG-', 'URU-', 'BRA-'];
    const chips = [];
    for (let i = 0; i < count; i++) {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const num = Math.floor(Math.random() * 100).toString().padStart(3, '0');
      chips.push(`${prefix}${num}`);
    }
    return chips;
  }

  static estimateDistance(locationId) {
    // Dummy distance generator
    const dist = (Math.random() * 5 + 0.1).toFixed(1);
    return `${dist} km`;
  }

  static calculateReputation(userId) {
    return '🟢 Muy activo';
  }

  static getBadgesForUser(userId) {
    // Would fetch real badges
    return ['BadgeTrustedIcon', 'BadgeTopTradeIcon'];
  }
}
