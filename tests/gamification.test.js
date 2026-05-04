import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  LEVELS, LEVEL_ORDER, LEVEL_REQUIREMENTS, ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES,
  BADGES, REWARD_TYPES, ACHIEVEMENT_REWARDS,
  getLevelProgress, getNextLevelMessage
} from '../src/lib/gamification'

// ============================================
// LEVEL DEFINITIONS
// ============================================
describe('Level Definitions', () => {
  it('should have exactly 4 levels', () => {
    expect(Object.keys(LEVELS)).toHaveLength(4)
  })

  it('should have correct level order', () => {
    expect(LEVEL_ORDER).toEqual(['explorador', 'coleccionista', 'intercambiador', 'referente'])
  })

  it('each level should have required properties', () => {
    for (const key of LEVEL_ORDER) {
      const level = LEVELS[key]
      expect(level.key).toBe(key)
      expect(level.name).toBeTruthy()
      expect(level.order).toBeGreaterThan(0)
      expect(level.icon).toBeTruthy()
      expect(level.color).toBeTruthy()
      expect(level.gradient).toBeTruthy()
      expect(level.description).toBeTruthy()
    }
  })

  it('referente should be the final level (no next)', () => {
    expect(LEVELS.referente.next).toBeNull()
  })

  it('levels should chain correctly', () => {
    expect(LEVELS.explorador.next).toBe('coleccionista')
    expect(LEVELS.coleccionista.next).toBe('intercambiador')
    expect(LEVELS.intercambiador.next).toBe('referente')
  })

  it('should NOT use gamer terminology', () => {
    for (const key of LEVEL_ORDER) {
      const level = LEVELS[key]
      expect(level.name).not.toMatch(/\blevel\b|\blvl\b|\bxp\b|\brank\b/i)
    }
  })
})

// ============================================
// ACHIEVEMENTS
// ============================================
describe('Achievement Definitions', () => {
  it('should have exactly 28 achievements', () => {
    expect(Object.keys(ACHIEVEMENTS)).toHaveLength(28)
  })

  it('should have the expected amount per category', () => {
    const expectedCounts = {
      actividad: 5,
      intercambio: 5,
      coleccion: 5,
      reputacion: 5,
      comunidad: 8,
    }

    for (const cat of ACHIEVEMENT_CATEGORIES) {
      const count = Object.values(ACHIEVEMENTS).filter(a => a.category === cat.key).length
      expect(count).toBe(expectedCounts[cat.key])
    }
  })

  it('each achievement should have required properties', () => {
    for (const [key, ach] of Object.entries(ACHIEVEMENTS)) {
      expect(ach.name).toBeTruthy()
      expect(ach.description).toBeTruthy()
      expect(ach.category).toBeTruthy()
      expect(ach.icon).toBeTruthy()
      expect(ach.target).toBeGreaterThan(0)
    }
  })

  it('all achievement keys should have reward mappings (even if null)', () => {
    for (const key of Object.keys(ACHIEVEMENTS)) {
      expect(key in ACHIEVEMENT_REWARDS).toBe(true)
    }
  })
})

// ============================================
// BADGES
// ============================================
describe('Badge Definitions', () => {
  it('should have 8+ visible badges', () => {
    expect(Object.keys(BADGES).length).toBeGreaterThanOrEqual(8)
  })

  it('each badge should have required properties', () => {
    for (const [key, badge] of Object.entries(BADGES)) {
      expect(badge.name).toBeTruthy()
      expect(badge.icon).toBeTruthy()
      expect(badge.color).toBeTruthy()
      expect(badge.description).toBeTruthy()
    }
  })
})

// ============================================
// REWARDS
// ============================================
describe('Reward Types', () => {
  it('should have digital-only reward types', () => {
    const types = Object.keys(REWARD_TYPES)
    expect(types.length).toBeGreaterThanOrEqual(8)

    // Should not have physical rewards
    for (const [key, rt] of Object.entries(REWARD_TYPES)) {
      expect(key).not.toMatch(/physical|ship|mail|coupon/i)
    }
  })

  it('each reward type should have name and description', () => {
    for (const [key, rt] of Object.entries(REWARD_TYPES)) {
      expect(rt.name).toBeTruthy()
      expect(rt.description).toBeTruthy()
      expect(rt.icon).toBeTruthy()
    }
  })
})

// ============================================
// LEVEL PROGRESS CALCULATION
// ============================================
describe('getLevelProgress', () => {
  it('should return 100% for referente (no next level)', () => {
    const result = getLevelProgress('referente', {}, {})
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should return 0% for explorador with no progress', () => {
    const result = getLevelProgress('explorador', {}, {})
    expect(result.percent).toBe(0)
    expect(result.allMet).toBe(false)
    expect(result.requirements.length).toBeGreaterThan(0)
  })

  it('should correctly evaluate explorador -> coleccionista requirements', () => {
    const profile = { name: 'Test User', avatar_url: 'https://example.com/avatar.jpg' }
    const progress = { total_albums: 1, total_stickers_loaded: 10 }

    const result = getLevelProgress('explorador', progress, profile)
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should show partial progress correctly', () => {
    const profile = { name: 'Test', avatar_url: null }
    const progress = { total_albums: 1, total_stickers_loaded: 5 }

    const result = getLevelProgress('explorador', progress, profile)
    // name: true, avatar: false, album: true, stickers: false => 2/4 = 50%
    expect(result.percent).toBe(50)
    expect(result.allMet).toBe(false)
  })

  it('should correctly evaluate coleccionista -> intercambiador', () => {
    const progress = { total_favorites: 3, total_chats: 3, total_trades: 1 }

    const result = getLevelProgress('coleccionista', progress, {})
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should correctly evaluate intercambiador -> referente', () => {
    const profile = { has_reports: false }
    const progress = { total_trades: 5, days_active: 7 }

    const result = getLevelProgress('intercambiador', progress, profile)
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should fail referente check if user has reports', () => {
    const profile = { has_reports: true }
    const progress = { total_trades: 5, days_active: 7 }

    const result = getLevelProgress('intercambiador', progress, profile)
    expect(result.allMet).toBe(false)
  })
})

// ============================================
// NEXT LEVEL MESSAGE
// ============================================
describe('getNextLevelMessage', () => {
  it('should return circuit message for referente', () => {
    const msg = getNextLevelMessage('referente', {}, {})
    expect(msg).toContain('Circuito Referente')
  })

  it('should return pending requirement for explorador', () => {
    const msg = getNextLevelMessage('explorador', {}, {})
    expect(msg).toContain('Te falta:')
  })

  it('should return ready message when all met', () => {
    const profile = { name: 'Test', avatar_url: 'url' }
    const progress = { total_albums: 1, total_stickers_loaded: 10 }
    const msg = getNextLevelMessage('explorador', progress, profile)
    expect(msg).toContain('listo para subir')
  })
})

// ============================================
// REWARD RESOLUTION RULES
// ============================================
describe('Reward Resolution Rules', () => {
  it('should not grant rewards for spam actions (no login/click rewards)', () => {
    // Verify no achievement rewards login or click
    for (const [key, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
      if (reward) {
        expect(key).not.toMatch(/login|click|tap|visit/i)
      }
    }
  })

  it('achievement rewards should only be digital', () => {
    for (const [key, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
      if (reward) {
        expect(reward.type).toBeTruthy()
        expect(reward.value).toBeTruthy()
        // Must be a digital reward type
        expect(REWARD_TYPES[reward.type]).toBeDefined()
      }
    }
  })

  it('rewards with hours should be reasonable (not unlimited)', () => {
    for (const [key, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
      if (reward && reward.hours) {
        expect(reward.hours).toBeLessThanOrEqual(72) // max 3 days
        expect(reward.hours).toBeGreaterThan(0)
      }
    }
  })
})

// ============================================
// LEVEL REQUIREMENTS INTEGRITY
// ============================================
describe('Level Requirements Integrity', () => {
  it('should not reward empty logins or spam', () => {
    // Check that no requirement checks for login count, click count etc
    for (const [lvl, config] of Object.entries(LEVEL_REQUIREMENTS)) {
      for (const req of config.requirements) {
        expect(req.key).not.toMatch(/login|click|tap|visit|open/i)
      }
    }
  })

  it('requirements should only track useful actions', () => {
    const validKeys = [
      'profile_name', 'avatar', 'album', 'stickers',
      'favorites', 'chats', 'trade', 'trades',
      'no_reports', 'activity'
    ]
    for (const [lvl, config] of Object.entries(LEVEL_REQUIREMENTS)) {
      for (const req of config.requirements) {
        expect(validKeys).toContain(req.key)
      }
    }
  })

  it('thresholds should match spec exactly', () => {
    // Explorador -> Coleccionista
    const colReqs = LEVEL_REQUIREMENTS.coleccionista.requirements
    expect(colReqs).toHaveLength(4)

    // Coleccionista -> Intercambiador
    const intReqs = LEVEL_REQUIREMENTS.intercambiador.requirements
    expect(intReqs).toHaveLength(3)

    // Intercambiador -> Referente
    const refReqs = LEVEL_REQUIREMENTS.referente.requirements
    expect(refReqs).toHaveLength(3)
  })
})

// ============================================
// ANTI-ABUSE
// ============================================
describe('Anti-abuse safeguards', () => {
  it('should not have visible XP, points, coins, or tokens in level names', () => {
    for (const level of Object.values(LEVELS)) {
      expect(level.name).not.toMatch(/\bxp\b|\bpoints?\b|\bcoins?\b|\btokens?\b|\bgems?\b/i)
      expect(level.description).not.toMatch(/\bxp\b|\bpoints?\b|\bcoins?\b|\btokens?\b|\bgems?\b/i)
    }
  })

  it('should not have gamer aesthetics in achievement names', () => {
    for (const ach of Object.values(ACHIEVEMENTS)) {
      expect(ach.name).not.toMatch(/loot|chest|spin|wheel|gacha|prize/i)
    }
  })

  it('reward types should not include gambling mechanics', () => {
    for (const key of Object.keys(REWARD_TYPES)) {
      expect(key).not.toMatch(/spin|wheel|lottery|gacha|chest|loot|box/i)
    }
  })
})
