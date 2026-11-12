import { describe, expect, it } from 'vitest'
import type { Routine, UserProgram } from '@/types'
import { compareWithPrevious } from './progress'
import { createSession, planPosition, replaceInRoutine } from './session'
import { itemForGoal } from './goal'
import { done, lookup, set } from './testFixtures'

const routine = (id: string): Routine => ({ id, name: id, place: 'gym', items: [], createdAt: 0, updatedAt: 0 })

describe('planPosition', () => {
  const program: UserProgram = { id: 'p', name: 'P', place: 'gym', routineIds: ['a', 'b', 'c'], createdAt: 0 }
  const routines = [routine('a'), routine('b'), routine('c')]
  const at = (day: string) => new Date(`${day}T12:00:00`).getTime()

  it('is day 1, week 1 before any workout', () => {
    expect(planPosition(program, routines, [], at('2026-11-12'))).toMatchObject({ day: 1, total: 3, week: 1, weeks: null, deload: false, finished: false })
  })

  it('counts calendar weeks from the first workout of the program', () => {
    // 2026-10-24 is a Saturday (week start); 2026-11-12 is three weeks later.
    const history = [done('2026-10-24', [], { programId: 'p', routineId: 'a' }), done('2026-11-10', [], { programId: 'p', routineId: 'b' })]
    expect(planPosition(program, routines, history, at('2026-11-12'))).toMatchObject({ day: 3, total: 3, week: 3 })
  })

  it('ignores workouts of other programs', () => {
    const history = [done('2026-01-01', [], { programId: 'other', routineId: 'a' })]
    expect(planPosition(program, routines, history, at('2026-11-12'))?.week).toBe(1)
  })

  it('marks the last week of a block as deload and the week after as finished', () => {
    const block = { ...program, weeks: 3 }
    const history = [done('2026-10-24', [], { programId: 'p', routineId: 'a' })]
    expect(planPosition(block, routines, history, at('2026-11-02'))).toMatchObject({ week: 2, deload: false, finished: false })
    expect(planPosition(block, routines, history, at('2026-11-12'))).toMatchObject({ week: 3, deload: true, finished: false })
    expect(planPosition(block, routines, history, at('2026-11-16'))).toMatchObject({ week: 4, deload: false, finished: true })
  })

  it('starts again at week 1 after a restart', () => {
    const history = [done('2026-09-01', [], { programId: 'p', routineId: 'a' })]
    const restarted = { ...program, weeks: 8, cycleStart: at('2026-11-10') }
    expect(planPosition(restarted, routines, history, at('2026-11-12'))).toMatchObject({ week: 1, finished: false, sessions: [] })
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

describe('replaceInRoutine', () => {
  it('swaps the exercise for good, keeping sets and rest', () => {
    const items = [{ exerciseId: 'bench', sets: 4, reps: 8, restSec: 120 }, { exerciseId: 'squat', sets: 3, reps: 5 }]
    expect(replaceInRoutine(items, 'bench', 'db-bench', lookup)).toEqual([{ exerciseId: 'db-bench', sets: 4, reps: 8, restSec: 120 }, items[1]])
  })

  it('switches the target between reps and seconds when the new move is measured differently', () => {
    expect(replaceInRoutine([{ exerciseId: 'bench', sets: 3, reps: 8 }], 'bench', 'plank', lookup)).toEqual([{ exerciseId: 'plank', sets: 3, sec: 30 }])
    expect(replaceInRoutine([{ exerciseId: 'plank', sets: 3, sec: 45 }], 'plank', 'push-up', lookup)).toEqual([{ exerciseId: 'push-up', sets: 3, reps: 10 }])
  })
})

describe('goal and deload', () => {
  const routineOf = (items: Routine['items']): Routine => ({ id: 'r', name: 'R', place: 'gym', items, createdAt: 0, updatedAt: 0 })
  const ctx = (history: ReturnType<typeof done>[] = []) => ({ lookup, history, defaultRestSec: 60, profile: { kg: 80, heightCm: null, level: 'intermediate' as const, unit: 'kg' as const } })

  it('turns targets into strength or fitness work', () => {
    const bench = { exerciseId: 'bench', sets: 3, reps: 10 }
    expect(itemForGoal(bench, lookup('bench'), 'strength').reps).toBe(6)
    expect(itemForGoal({ ...bench, reps: 8 }, lookup('bench'), 'strength').reps).toBe(5)
    expect(itemForGoal({ exerciseId: 'push-up', sets: 3, reps: 10 }, lookup('push-up'), 'strength').reps).toBe(10) // no load to add
    expect(itemForGoal(bench, lookup('bench'), 'fitness').reps).toBe(14)
    expect(itemForGoal({ exerciseId: 'plank', sets: 3, sec: 30 }, lookup('plank'), 'fitness').sec).toBe(40)
    expect(itemForGoal(bench, lookup('bench'), 'muscle')).toBe(bench)
  })

  it('applies the goal when a session is created', () => {
    const session = createSession({ place: 'gym', routine: routineOf([{ exerciseId: 'bench', sets: 3, reps: 10 }]) }, { ...ctx(), goal: 'strength' })
    expect(session.entries[0]!.sets.every((s) => s.reps === 6)).toBe(true)
  })

  it('makes the deload week a set shorter and about 10% lighter, and later prefills skip it', () => {
    const history = [done('2026-11-01', [['bench', [set(60, 8), set(60, 8), set(60, 8)]]])]
    const routine = routineOf([{ exerciseId: 'bench', sets: 3, reps: 10 }])
    const light = createSession({ place: 'gym', routine }, { ...ctx(history), deload: true })
    expect(light.deload).toBe(true)
    expect(light.entries[0]!.prefill).toBe('deload')
    expect(light.entries[0]!.sets.map((s) => s.weight)).toEqual([52.5, 52.5])

    const deloadDone = done('2026-11-08', [['bench', [set(52.5, 8), set(52.5, 8)]]], { deload: true })
    const after = createSession({ place: 'gym', routine }, ctx([...history, deloadDone]))
    expect(after.entries[0]!.sets[0]!.weight).toBe(60)
  })
})
