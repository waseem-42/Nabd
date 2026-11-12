import { describe, expect, it } from 'vitest'
import type { ProgramTemplate } from '@/types'
import { alternativesFor, filterForPlace, fitsPlace, routineFit, templateFit, type HomeGear } from './place'
import { ALL, BAND_FLY, BENCH, CALF_RAISE, DB_BENCH, PLANK, PULL_UP, PUSH_UP, SQUAT, ex, lookup } from './testFixtures'

const NOTHING: HomeGear = { homeEquipment: ['bodyweight'], homeAccessories: [] }
const DUMBBELLS_AND_BENCH: HomeGear = { homeEquipment: ['dumbbell'], homeAccessories: ['bench'] }

describe('fitsPlace', () => {
  it('fits everything at the gym', () => {
    expect(ALL.every((e) => fitsPlace(e, 'gym', NOTHING))).toBe(true)
  })

  it('always allows bodyweight at home, even when not listed', () => {
    expect(fitsPlace(PUSH_UP, 'home', { homeEquipment: [], homeAccessories: [] })).toBe(true)
  })

  it('requires owned equipment at home', () => {
    expect(fitsPlace(BAND_FLY, 'home', NOTHING)).toBe(false)
    expect(fitsPlace(BAND_FLY, 'home', { homeEquipment: ['band'], homeAccessories: [] })).toBe(true)
  })

  it('requires every needed accessory at home', () => {
    expect(fitsPlace(PULL_UP, 'home', NOTHING)).toBe(false)
    expect(fitsPlace(PULL_UP, 'home', { ...NOTHING, homeAccessories: ['pullup-bar'] })).toBe(true)
    expect(fitsPlace(DB_BENCH, 'home', { homeEquipment: ['dumbbell'], homeAccessories: [] })).toBe(false)
    expect(fitsPlace(DB_BENCH, 'home', DUMBBELLS_AND_BENCH)).toBe(true)
  })
})

describe('filterForPlace', () => {
  it('keeps only what fits', () => {
    expect(filterForPlace(ALL, 'home', NOTHING).map((e) => e.id)).toEqual(['push-up', 'dips', 'plank', 'calf-raise'])
    expect(filterForPlace(ALL, 'gym', NOTHING)).toHaveLength(ALL.length)
  })
})

describe('routineFit / templateFit', () => {
  it('lists unique missing exercises, unknown ids included', () => {
    const routine = {
      items: [
        { exerciseId: 'push-up', sets: 3 },
        { exerciseId: 'bench', sets: 3 },
        { exerciseId: 'bench', sets: 2 },
        { exerciseId: 'gone', sets: 3 },
      ],
    }
    expect(routineFit(routine, 'home', NOTHING, lookup)).toEqual({ fits: false, missing: ['bench', 'gone'] })
    expect(routineFit({ items: [{ exerciseId: 'push-up', sets: 3 }] }, 'home', NOTHING, lookup)).toEqual({
      fits: true,
      missing: [],
    })
  })

  it('checks every day of a template', () => {
    const template: ProgramTemplate = {
      id: 't',
      name: { en: 'T', ar: 'T' },
      description: { en: '', ar: '' },
      place: 'home',
      level: 'beginner',
      daysPerWeek: 2,
      weeks: 8,
      days: [
        { name: { en: 'A', ar: 'A' }, items: [{ exerciseId: 'push-up', sets: 3 }] },
        { name: { en: 'B', ar: 'B' }, items: [{ exerciseId: 'db-bench', sets: 3 }] },
      ],
    }
    expect(templateFit(template, 'home', NOTHING, lookup)).toEqual({ fits: false, missing: ['db-bench'] })
    expect(templateFit(template, 'home', DUMBBELLS_AND_BENCH, lookup).fits).toBe(true)
    expect(templateFit(template, 'gym', NOTHING, lookup).fits).toBe(true)
  })
})

describe('alternativesFor', () => {
  it('suggests only exercises that fit the place, never the exercise itself', () => {
    const ids = alternativesFor(BENCH, ALL, 'home', NOTHING).map((e) => e.id)
    expect(ids).not.toContain('bench')
    expect(ids).not.toContain('db-bench')
    expect(ids).not.toContain('band-fly')
    expect(ids).toEqual(['push-up', 'dips'])
  })

  it('ranks same primary muscle first, then related muscles; unrelated never', () => {
    const ids = alternativesFor(BENCH, ALL, 'gym', NOTHING).map((e) => e.id)
    expect(ids.indexOf('dips')).toBe(ids.length - 1)
    expect(ids).not.toContain('calf-raise')
    expect(ids).not.toContain('squat')
    // db-bench shares kind, level and a secondary muscle with the barbell bench press.
    expect(ids[0]).toBe('db-bench')
  })

  it('requires the same mode', () => {
    const holds = alternativesFor(ex('hollow-hold', { primary: 'abdomen', mode: 'time' }), ALL, 'gym', NOTHING)
    expect(holds.map((e) => e.id)).toEqual(['plank'])
    expect(alternativesFor(PLANK, ALL, 'gym', NOTHING)).toEqual([])
  })

  it('skips excluded ids and honours the limit', () => {
    const ids = alternativesFor(BENCH, ALL, 'gym', NOTHING, { exclude: ['db-bench'], limit: 2 }).map((e) => e.id)
    expect(ids).toHaveLength(2)
    expect(ids).not.toContain('db-bench')
  })

  it('uses the muscle group for related muscles', () => {
    expect(alternativesFor(CALF_RAISE, ALL, 'gym', NOTHING).map((e) => e.id)).toEqual(['squat'])
    expect(alternativesFor(SQUAT, ALL, 'home', NOTHING).map((e) => e.id)).toEqual(['calf-raise'])
  })
})
