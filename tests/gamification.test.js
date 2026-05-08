import { describe, it, expect } from 'vitest'
import {
  LEVELS,
  LEVEL_ORDER,
  LEVEL_REQUIREMENTS,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
  BADGES,
  REWARD_TYPES,
  ACHIEVEMENT_REWARDS,
  XP_SOURCES,
  IMPACT_AREAS,
  getLevelProgress,
  getNextLevelMessage,
  getXPForAction,
  buildGamificationImpactSummary,
} from '../src/lib/gamification'

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

  it('referente should be the final level', () => {
    expect(LEVELS.referente.next).toBeNull()
  })
})

describe('Achievement Definitions', () => {
  it('should include the redesigned categories', () => {
    expect(ACHIEVEMENT_CATEGORIES.map((c) => c.key)).toEqual([
      'progreso',
      'reputacion',
      'coleccion',
      'comunidad',
      'growth',
      'partner',
    ])
  })

  it('should include the requested new achievements', () => {
    const names = Object.values(ACHIEVEMENTS).map((a) => a.name)
    expect(names).toContain('Primer intercambio')
    expect(names).toContain('Intercambio confirmado')
    expect(names).toContain('Siempre cumple')
    expect(names).toContain('Punto sugerido')
    expect(names).toContain('Curador')
    expect(names).toContain('Album cargado')
    expect(names).toContain('Archivista')
    expect(names).toContain('Activo la red')
    expect(names).toContain('No vine solo')
    expect(names).toContain('Verificado en PartnerStore')
    expect(names).toContain('Desde el comienzo')
  })

  it('each achievement should have required properties', () => {
    for (const ach of Object.values(ACHIEVEMENTS)) {
      expect(ach.name).toBeTruthy()
      expect(ach.description).toBeTruthy()
      expect(ach.category).toBeTruthy()
      expect(ach.icon).toBeTruthy()
      expect(ach.target).toBeGreaterThan(0)
    }
  })

  it('all achievement keys should have reward mappings', () => {
    for (const key of Object.keys(ACHIEVEMENTS)) {
      expect(key in ACHIEVEMENT_REWARDS).toBe(true)
    }
  })
})

describe('XP Sources', () => {
  it('should define meaningful XP sources for the live system', () => {
    expect(XP_SOURCES.exchange_confirmed.xp).toBeGreaterThan(XP_SOURCES.share_album.xp)
    expect(XP_SOURCES.friend_activated.xp).toBeGreaterThan(XP_SOURCES.invite_friend.xp)
    expect(XP_SOURCES.partner_album_validation.impact).toContain('trust')
  })

  it('should not reward empty usage actions', () => {
    for (const key of Object.keys(XP_SOURCES)) {
      expect(key).not.toMatch(/login|click|tap|visit|open/i)
    }
  })

  it('should resolve XP values from actions', () => {
    expect(getXPForAction('exchange_confirmed')).toBe(80)
    expect(getXPForAction('missing_action')).toBe(0)
  })
})

describe('Badges and Rewards', () => {
  it('should have 8+ visible badges', () => {
    expect(Object.keys(BADGES).length).toBeGreaterThanOrEqual(8)
  })

  it('reward types should stay digital-only', () => {
    for (const key of Object.keys(REWARD_TYPES)) {
      expect(key).not.toMatch(/physical|ship|mail|coupon/i)
    }
  })

  it('reward mappings should only use known reward types', () => {
    for (const reward of Object.values(ACHIEVEMENT_REWARDS)) {
      if (reward) expect(REWARD_TYPES[reward.type]).toBeDefined()
    }
  })
})

describe('Level Progress Calculation', () => {
  it('should return 100% for referente', () => {
    const result = getLevelProgress('referente', {}, {})
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should use confirmed exchanges for intercambiador requirements', () => {
    const progress = { completed_exchanges: 1, total_duplicates_loaded: 20, total_chats: 3 }
    const result = getLevelProgress('coleccionista', progress, {})
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })

  it('should use reliability and completion rate for referente requirements', () => {
    const progress = { completed_exchanges: 5, reliability_score: 75, completion_rate: 72 }
    const result = getLevelProgress('intercambiador', progress, {})
    expect(result.percent).toBe(100)
    expect(result.allMet).toBe(true)
  })
})

describe('Next Level Message', () => {
  it('should return circuit message for referente', () => {
    expect(getNextLevelMessage('referente', {}, {})).toContain('Circuito Referente')
  })

  it('should return ready message when all requirements are met', () => {
    const profile = { name: 'Test', avatar_url: 'url' }
    const progress = { total_albums: 1, total_stickers_loaded: 15 }
    expect(getNextLevelMessage('explorador', progress, profile)).toContain('Estas listo')
  })
})

describe('Impact Summary', () => {
  it('should expose the gamification impact areas', () => {
    expect(Object.keys(IMPACT_AREAS)).toEqual([
      'ranking',
      'trust',
      'visibility',
      'growth',
      'liquidez',
      'community',
    ])
  })

  it('should map progress, achievements and rewards into impact signals', () => {
    const summary = buildGamificationImpactSummary(
      { completed_exchanges: 2, reliability_score: 80 },
      [{ key: 'friend_active', completed: true }, { key: 'share_album', completed: true }],
      [{ type: 'boost_visibility', expires_at: new Date(Date.now() + 3600000).toISOString() }]
    )

    expect(summary.trust).toBe(true)
    expect(summary.visibility).toBe(true)
    expect(summary.growth).toBe(true)
    expect(summary.community).toBe(true)
    expect(summary.liquidez).toBe(true)
  })
})

describe('Anti-abuse safeguards', () => {
  it('should not use gamer terminology in level names', () => {
    for (const level of Object.values(LEVELS)) {
      expect(level.name).not.toMatch(/\bxp\b|\bcoins?\b|\btokens?\b|\bgems?\b/i)
    }
  })

  it('should not have gambling mechanics in reward types', () => {
    for (const key of Object.keys(REWARD_TYPES)) {
      expect(key).not.toMatch(/spin|wheel|lottery|gacha|loot|box/i)
    }
  })

  it('should keep level requirements focused on useful actions', () => {
    const validKeys = [
      'profile_name',
      'avatar',
      'album',
      'stickers',
      'confirmed_exchange',
      'duplicates',
      'chats',
      'confirmed_exchanges',
      'reliability',
      'completion_rate',
    ]

    for (const config of Object.values(LEVEL_REQUIREMENTS)) {
      for (const req of config.requirements) {
        expect(validKeys).toContain(req.key)
      }
    }
  })
})
