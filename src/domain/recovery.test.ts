import { describe, expect, it } from 'vitest'
import { muscleReadiness } from './recovery'
import { done, lookup, set } from './testFixtures'

describe('muscleReadiness', () => {
  it('lowers the groups trained recently and recovers them over time', () => {
    const session = done('2026-11-09', [['bench', [set(60, 8)]]])
    const now = session.endedAt! + 24 * 3_600_000
    const byGroup = Object.fromEntries(muscleReadiness([session], lookup, now).map((r) => [r.group, r]))
    expect(byGroup.chest).toMatchObject({ value: 0.33, hoursSince: 24 })
    // Triceps and shoulders helped: they recover faster.
    expect(byGroup.arms!.value).toBe(0.5)
    expect(byGroup.legs).toMatchObject({ value: 1, hoursSince: null })
    expect(muscleReadiness([session], lookup, session.endedAt! + 80 * 3_600_000).every((r) => r.value === 1)).toBe(true)
  })
})
