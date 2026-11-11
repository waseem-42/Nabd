import { describe, expect, it } from 'vitest'
import type { Equipment } from '@/types'
import {
  bodyweightShare,
  platesPerSide,
  prefersLowImpact,
  progressSets,
  roundLoad,
  suggestStartWeight,
  warmupRoutine,
  warmupSets,
  type BodyProfile,
} from './loading'
import { createSession, type PrefillContext } from './session'
import { done, ex, lookup, set } from './testFixtures'

const profile = (patch: Partial<BodyProfile> = {}): BodyProfile => ({ kg: 80, heightCm: 178, level: 'beginner', unit: 'kg', ...patch })
const named = (en: string, equipment: Equipment) => ex(en, { name: { en, ar: en }, equipment })

describe('suggestStartWeight', () => {
  it('scales from body weight and rounds to a loadable barbell weight', () => {
    expect(suggestStartWeight(named('Barbell Bench Press', 'barbell'), profile())).toBe(32.5)
    expect(suggestStartWeight(named('Barbell Deadlift', 'barbell'), profile())).toBe(47.5)
    // Never below the empty bar.
    expect(suggestStartWeight(named('Barbell Curl', 'barbell'), profile({ kg: 50 }))).toBe(20)
  })

  it('is heavier for experienced lifters and per hand for dumbbells', () => {
    const press = named('Dumbbell Bench Press', 'dumbbell')
    expect(suggestStartWeight(press, profile())).toBe(10)
    expect(suggestStartWeight(press, profile({ level: 'advanced' }))).toBe(18)
  })

  it('declines without body weight, for bodyweight moves and for assistance machines', () => {
    expect(suggestStartWeight(named('Barbell Bench Press', 'barbell'), profile({ kg: null }))).toBeNull()
    expect(suggestStartWeight(named('Push-up', 'bodyweight'), profile())).toBeNull()
    expect(suggestStartWeight(named('Assisted Pull-up', 'machine'), profile())).toBeNull()
  })

  it('rounds in pounds for lb users', () => {
    const kg = suggestStartWeight(named('Barbell Bench Press', 'barbell'), profile({ unit: 'lb' }))!
    expect(Math.round(kg * 2.2046226218)).toBe(70)
  })
})

describe('warmupSets', () => {
  it('ramps a heavy barbell lift from the empty bar', () => {
    expect(warmupSets(100, 'barbell', 'kg').map((s) => [s.weight, s.reps, s.kind])).toEqual([
      [20, 10, 'warmup'],
      [40, 5, 'warmup'],
      [60, 3, 'warmup'],
      [80, 2, 'warmup'],
    ])
  })

  it('skips loads that are already light', () => {
    expect(warmupSets(25, 'barbell', 'kg')).toEqual([])
    expect(warmupSets(6, 'dumbbell', 'kg')).toEqual([])
  })

  it('never reaches the working weight', () => {
    for (const w of [32.5, 45, 70, 140]) for (const s of warmupSets(w, 'barbell', 'kg')) expect(s.weight).toBeLessThan(w)
  })
})

describe('progressSets', () => {
  const bench = named('Barbell Bench Press', 'barbell')
  it('adds one step when every target was hit', () => {
    expect(progressSets([set(60, 8), set(60, 8)], bench, 8, 'kg')?.map((s) => s.weight)).toEqual([62.5, 62.5])
  })
  it('holds when a set fell short', () => {
    expect(progressSets([set(60, 8), set(60, 6)], bench, 8, 'kg')).toBeNull()
  })
  it('adds a rep for bodyweight moves', () => {
    expect(progressSets([set(0, 12)], named('Push-up', 'bodyweight'), 12, 'kg')?.[0]?.reps).toBe(13)
  })
})

describe('body helpers', () => {
  it('rounds loads', () => {
    expect(roundLoad(33, 'barbell', 'kg')).toBe(32.5)
    expect(roundLoad(3, 'kettlebell', 'kg')).toBe(4)
  })

  it('knows roughly how much body weight common moves lift', () => {
    expect(bodyweightShare(named('Push-up', 'bodyweight'))).toBe(0.65)
    expect(bodyweightShare(named('Pull-up', 'bodyweight'))).toBe(1)
    expect(bodyweightShare(named('Bodyweight Squat', 'bodyweight'))).toBeNull()
  })

  it('picks joint-friendly warm-ups for a higher BMI', () => {
    expect(prefersLowImpact({ kg: 105, heightCm: 175 })).toBe(true)
    expect(prefersLowImpact({ kg: 75, heightCm: 175 })).toBe(false)
    expect(warmupRoutine(['quads'], profile({ kg: 120, heightCm: 175 }), false)[0]?.move).toBe('march')
    expect(warmupRoutine(['chest'], profile(), false).map((i) => i.move)).toEqual(['jog', 'armCircles', 'scapPushup'])
  })

  it('works out plates per side', () => {
    expect(platesPerSide(100, 'kg')).toEqual({ bar: 20, plates: [25, 15], rest: 0 })
    expect(platesPerSide(20, 'kg')).toEqual({ bar: 20, plates: [], rest: 0 })
    expect(platesPerSide(15, 'kg')).toBeNull()
  })
})

describe('sessions use the profile', () => {
  const ctx = (patch: Partial<PrefillContext> = {}): PrefillContext => ({ lookup, history: [], defaultRestSec: 90, profile: profile(), ...patch })
  const routine = { id: 'r', name: 'R', place: 'gym' as const, createdAt: 0, updatedAt: 0, items: [{ exerciseId: 'squat', sets: 3, reps: 5 }, { exerciseId: 'bench', sets: 3, reps: 8 }] }

  it('progresses from history and explains why', () => {
    const history = [done('2026-10-08', [['bench', [set(60, 8), set(60, 8), set(60, 8)]]])]
    const s = createSession({ place: 'gym', routine }, ctx({ history }))
    expect(s.entries[1]).toMatchObject({ prefill: 'progress' })
    expect(s.entries[1]!.sets.map((x) => x.weight)).toEqual([62.5, 62.5, 62.5])
  })

  it('prepends ramp-up sets to the first heavy lift of each group only', () => {
    const history = [done('2026-10-08', [['squat', [set(100, 5)]], ['bench', [set(70, 6)]]])]
    const s = createSession({ place: 'gym', routine }, ctx({ history, autoWarmup: true }))
    expect(s.entries[0]!.sets.filter((x) => x.kind === 'warmup').length).toBe(4)
    expect(s.entries[1]!.sets.filter((x) => x.kind === 'warmup').length).toBe(3)
    const off = createSession({ place: 'gym', routine }, ctx({ history }))
    expect(off.entries[0]!.sets.every((x) => x.kind === 'normal')).toBe(true)
  })
})
