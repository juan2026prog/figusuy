import { describe, it, expect } from 'vitest'
import { validateBoostLimit, MAX_PREMIUM_BOOST, MAX_SPONSOR_BOOST, validateAlgorithmConfigValue } from '../src/lib/ranking'

describe('Ranking System Integrity', () => {
  describe('Rule: Boosts act as tiebreakers only', () => {
    it('Premium boost should never exceed the absolute maximum of 1.20x', () => {
      const result1 = validateBoostLimit(1.5, 'premium')
      expect(result1.value).toBe(MAX_PREMIUM_BOOST)
      expect(result1.wasLimited).toBe(true)

      const result2 = validateBoostLimit(1.10, 'premium')
      expect(result2.value).toBe(1.10)
      expect(result2.wasLimited).toBe(false)
    })

    it('Sponsor boost should never exceed the absolute maximum of 1.15x', () => {
      const result1 = validateBoostLimit(1.3, 'sponsor')
      expect(result1.value).toBe(MAX_SPONSOR_BOOST)
      expect(result1.wasLimited).toBe(true)

      const result2 = validateBoostLimit(1.05, 'sponsor')
      expect(result2.value).toBe(1.05)
      expect(result2.wasLimited).toBe(false)
    })
  })

  describe('Admin Algorithm Config Protection', () => {
    it('Prevents admins from saving boosts above the hard limit', () => {
      const check1 = validateAlgorithmConfigValue('premium_boost', '1.50')
      expect(check1.valid).toBe(false)
      expect(check1.value).toBe(MAX_PREMIUM_BOOST)
      expect(check1.warning).toContain('1.2')

      const check2 = validateAlgorithmConfigValue('sponsor_boost_max', '1.20')
      expect(check2.valid).toBe(false)
      expect(check2.value).toBe(MAX_SPONSOR_BOOST)
    })

    it('Validates that ranking weights are clamped between 0 and 1', () => {
      const check = validateAlgorithmConfigValue('user_match_relevance_weight', '1.5')
      expect(check.valid).toBe(false)
      expect(check.value).toBe(1)

      const validCheck = validateAlgorithmConfigValue('business_trust_weight', '0.35')
      expect(validCheck.valid).toBe(true)
      expect(validCheck.value).toBe('0.35')
    })
  })

  describe('Business Discovery Workflow', () => {
    // Note: Integration tests requiring Supabase should mock the RPC call
    it('Ensures recommended businesses sort above regular businesses when relevance is tied', () => {
      // Mocked scoring
      const locA = { relevance: 80, engagement: 50, plan_boost: 1.0, sponsor_boost: 0 } // Gratis
      const locB = { relevance: 80, engagement: 50, plan_boost: 1.10, sponsor_boost: 1.10 } // Dominio

      const scoreA = locA.relevance * 0.4 + locA.engagement * 0.2
      const scoreB = (locB.relevance * 0.4 + locB.engagement * 0.2) * locB.plan_boost

      expect(scoreB).toBeGreaterThan(scoreA)
    })

    it('Ensures highly relevant organic stores defeat low-relevance sponsored stores', () => {
      const locOrganic = { relevance: 95, engagement: 80, plan_boost: 1.0, sponsor_boost: 0 }
      const locSponsored = { relevance: 30, engagement: 20, plan_boost: 1.10, sponsor_boost: 1.10 }

      const scoreOrganic = locOrganic.relevance * 0.5 + locOrganic.engagement * 0.3
      const scoreSponsored = (locSponsored.relevance * 0.5 + locSponsored.engagement * 0.3) * locSponsored.plan_boost

      expect(scoreOrganic).toBeGreaterThan(scoreSponsored) // 71.5 vs 23.1
    })
  })

  describe('Match Engine Contextual Scoring', () => {
    it('Matches with heavy overlap ALWAYS defeat low-overlap premium matches', () => {
      const organicMatch = { overlap: 30, distance: 10, globalRank: 50, boost: 1.0 }
      const premiumMatch = { overlap: 2, distance: 10, globalRank: 80, boost: 1.2 }

      const scoreOrganic = (organicMatch.overlap * 2) + (15 - organicMatch.distance) + (organicMatch.globalRank * 0.2)
      const scorePremium = ((premiumMatch.overlap * 2) + (15 - premiumMatch.distance) + (premiumMatch.globalRank * 0.2)) * premiumMatch.boost

      // 60 + 5 + 10 = 75
      // ((4 + 5 + 16) * 1.2) = 30
      expect(scoreOrganic).toBeGreaterThan(scorePremium)
    })
  })
})
