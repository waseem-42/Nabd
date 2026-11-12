import { describe, expect, it } from 'vitest'
import type { Routine, UserProgram } from '@/types'
import { compareWithPrevious } from './progress'
import { planPosition } from './session'
import { done, lookup, set } from './testFixtures'

const routine = (id: string): Routine => ({ id, name: id, place: 'gym', items: [], createdAt: 0, updatedAt: 0 })

describe('planPosition', () => {
  const program: UserProgram = { id: 'p', name: 'P', place: 'gym', routineIds: ['a', 'b', 'c'], createdAt: 0 }
  const routines = [routine('a'), routine('b'), routine('c')]
  const at = (day: string) => new Date(`${day}T12:00:00`).getTime()

  it('is day 1, week 1 before any workout', () => {
    expect(planPosition(program, routines, [], at('2026-11-12'))).toEqual({ day: 1, total: 3, week: 1 })
  })

  it('counts calendar weeks from the first workout of the program', () => {
    // 2026-10-24 is a Saturday (week start); 2026-11-12 is three weeks later.
    const history = [done('2026-10-24', [], { programId: 'p', routineId: 'a' }), done('2026-11-10', [], { programId: 'p', routineId: 'b' })]
    expect(planPosition(program, routines, history, at('2026-11-12'))).toEqual({ day: 3, total: 3, week: 3 })
  })

  it('ignores workouts of other programs', () => {
    const history = [done('2026-01-01', [], { programId: 'other', routineId: 'a' })]
    expect(planPosition(program, routines, history, at('2026-11-12'))?.week).toBe(1)
  })

  it('is null for a program without routines', () => {
    expect(planPosition({ ...program, routineIds: [] }, [], [])).toBeNull()
  })
})

describe('compareWithPrevious', () => {
  it('compares with the latest earlier session of the same routine', () => {
    const old = done('2026-11-01', [['bench', [set(60, 8)]]], { routineId: 'r' })
    const prev = done('2026-11-05', [['bench', [set(60, 8), set(60, 8)]], ['plank', [set(0, 0, { sec: 40 })]]], { routineId: 'r' })
    const other = done('2026-11-07', [['bench', [set(100, 1)]]], { routineId: 'x' })
    const now = done('2026-11-09', [['bench', [set(62.5, 8), set(62.5, 8)]], ['plank', [set(0, 0, { sec: 30 })]]], { routineId: 'r' })
    const result = compareWithPrevious(now, [old, prev, other, now], lookup)!
    expect(result.previous.id).toBe(prev.id)
    expect(result.volumePct).toBe(4) // 1000 vs 960
    expect(result.setsDelta).toBe(0)
    expect(result.improved).toEqual(['bench'])
    expect(result.declined).toEqual(['plank'])
  })

  it('is null for a quick workout or the first time a routine is done', () => {
    const quick = done('2026-11-09', [['bench', [set(60, 8)]]])
    expect(compareWithPrevious(quick, [quick], lookup)).toBeNull()
    const first = done('2026-11-09', [['bench', [set(60, 8)]]], { routineId: 'r' })
    expect(compareWithPrevious(first, [first], lookup)).toBeNull()
  })

  it('has no volume change when the previous session moved no weight', () => {
    const prev = done('2026-11-05', [['push-up', [set(0, 10)]]], { routineId: 'r' })
    const now = done('2026-11-09', [['push-up', [set(0, 12)]]], { routineId: 'r' })
    const result = compareWithPrevious(now, [prev], lookup)!
    expect(result.volumePct).toBeNull()
    expect(result.improved).toEqual(['push-up'])
  })
})
