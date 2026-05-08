import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_STATUS_META,
  formatPercent,
  getExchangePromptVisibility,
  getExchangeStatusMeta,
  getMyExchangeResponse,
} from '../src/lib/exchangeCompletion'

describe('exchange completion helpers', () => {
  it('returns known status metadata', () => {
    expect(getExchangeStatusMeta('completed')).toEqual(EXCHANGE_STATUS_META.completed)
    expect(getExchangeStatusMeta('unknown')).toEqual(EXCHANGE_STATUS_META.pending)
  })

  it('reads the current user response correctly', () => {
    const completion = { user_1_id: 'a', user_2_id: 'b', user_1_response: 'yes', user_2_response: 'no' }
    expect(getMyExchangeResponse(completion, 'a')).toBe('yes')
    expect(getMyExchangeResponse(completion, 'b')).toBe('no')
    expect(getMyExchangeResponse(completion, 'c')).toBeNull()
  })

  it('shows the prompt when trigger detection is positive', () => {
    const result = getExchangePromptVisibility(null, { should_prompt: true }, 'a')
    expect(result.visible).toBe(true)
    expect(result.reason).toBe('triggered')
  })

  it('keeps visibility for terminal states', () => {
    expect(getExchangePromptVisibility({ status: 'completed' }, null, 'a').visible).toBe(true)
    expect(getExchangePromptVisibility({ status: 'disputed' }, null, 'a').visible).toBe(true)
  })

  it('formats percentage safely', () => {
    expect(formatPercent(67.4)).toBe('67%')
    expect(formatPercent(null)).toBe('0%')
  })
})
