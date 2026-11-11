import { describe, expect, it } from 'vitest'
import type { Routine, UserProgram, WorkoutSession } from '@/types'
import {
  addExercise,
  addSet,
  createSession,
  finishSession,
  hasDoneSets,
  moveExercise,
  nextRoutine,
  removeExercise,
  removeSet,
  swapExercise,
  toggleSetDone,
  updateEntry,
  updateSet,
  updateSetCarry,
  type PrefillContext,
} from './session'
import { done, lookup, set } from './testFixtures'

const routine = (id: string, items: Routine['items'] = []): Routine => ({
  id,
  name: `Routine ${id}`,
  place: 'gym',
  items,
  createdAt: 0,
  updatedAt: 0,
})

const ctx = (history: WorkoutSession[] = []): PrefillContext => ({ lookup, history, defaultRestSec: 90 })

const PUSH_DAY = routine('push', [
  { exerciseId: 'bench', sets: 3, reps: 8, restSec: 120 },
  { exerciseId: 'plank', sets: 2, sec: 45 },
  { exerciseId: 'push-up', sets: 2 },
])

describe('createSession', () => {
  it('builds an active session from routine targets when there is no history', () => {
    const s = createSession({ place: 'gym', routine: PUSH_DAY, programId: 'p1', now: 1000 }, ctx())
    expect(s).toMatchObject({ status: 'active', place: 'gym', name: 'Routine push', routineId: 'push', programId: 'p1', startedAt: 1000 })
    expect(s.entries.map((e) => [e.exerciseId, e.sets.length, e.restSec])).toEqual([
      ['bench', 3, 120],
      ['plank', 2, 90],
      ['push-up', 2, 90],
    ])
    expect(s.entries[0]!.sets[0]).toEqual({ weight: 0, reps: 8, kind: 'normal', done: false })
    expect(s.entries[1]!.sets[0]).toMatchObject({ reps: 0, sec: 45 })
    // No target reps → mode default.
    expect(s.entries[2]!.sets[0]).toMatchObject({ weight: 0, reps: 10 })
  })

  it('prefills from the last time each exercise was done, set by set', () => {
    const history = [
      done('2026-10-01', [['bench', [set(60, 10)]]]),
      done('2026-10-08', [['bench', [set(80, 8), set(85, 6), set(40, 10, { kind: 'warmup' })]]]),
    ]
    const s = createSession({ place: 'gym', routine: PUSH_DAY }, ctx(history))
    expect(s.entries[0]!.sets.map((x) => [x.weight, x.reps, x.done, x.doneAt])).toEqual([
      [80, 8, false, undefined],
      [85, 6, false, undefined],
      [85, 6, false, undefined],
    ])
  })

  it('creates an empty quick session', () => {
    const s = createSession({ place: 'home' }, ctx())
    expect(s).toMatchObject({ entries: [], name: '', place: 'home' })
    expect(s.routineId).toBeUndefined()
  })
})

describe('set operations', () => {
  const base = createSession({ place: 'gym', routine: PUSH_DAY }, ctx())

  it('adds a copy of the last set, not done', () => {
    const done1 = toggleSetDone(updateSet(base, 0, 2, { weight: 70 }), 0, 2, 5)
    const s = addSet(done1, 0, ctx())
    expect(s.entries[0]!.sets).toHaveLength(4)
    expect(s.entries[0]!.sets[3]).toEqual({ weight: 70, reps: 8, kind: 'normal', done: false })
  })

  it('adds a default set to an empty entry', () => {
    const empty = removeSet(removeSet(base, 2, 0), 2, 0)
    expect(empty.entries[2]!.sets).toEqual([])
    expect(addSet(empty, 2, ctx()).entries[2]!.sets).toEqual([{ weight: 0, reps: 10, kind: 'normal', done: false }])
  })

  it('carries an edit to the following undone sets that held the same value', () => {
    const custom = updateSet(base, 0, 2, { weight: 50 })
    const done0 = toggleSetDone(updateSetCarry(custom, 0, 0, { weight: 60 }), 0, 0, 5)
    expect(done0.entries[0]!.sets.map((x) => x.weight)).toEqual([60, 60, 50])
    // Done sets and earlier sets stay as they are.
    const later = updateSetCarry(done0, 0, 1, { weight: 65, reps: 6 })
    expect(later.entries[0]!.sets.map((x) => [x.weight, x.reps])).toEqual([[60, 8], [65, 6], [50, 6]])
  })

  it('updates and removes sets without touching the input', () => {
    const s = updateSet(base, 0, 1, { weight: 60, reps: 5, kind: 'warmup' })
    expect(s.entries[0]!.sets[1]).toMatchObject({ weight: 60, reps: 5, kind: 'warmup' })
    expect(base.entries[0]!.sets[1]!.weight).toBe(0)
    expect(removeSet(s, 0, 1).entries[0]!.sets).toHaveLength(2)
  })

  it('toggles done, stamping and clearing doneAt', () => {
    const on = toggleSetDone(base, 0, 0, 1234)
    expect(on.entries[0]!.sets[0]).toMatchObject({ done: true, doneAt: 1234 })
    const off = toggleSetDone(on, 0, 0)
    expect(off.entries[0]!.sets[0]!.done).toBe(false)
    expect('doneAt' in off.entries[0]!.sets[0]!).toBe(false)
  })

  it('returns the same session for out-of-range indexes', () => {
    expect(updateSet(base, 9, 0, { reps: 1 })).toBe(base)
    expect(toggleSetDone(base, 0, 9)).toBe(base)
    expect(removeSet(base, 0, 9)).toBe(base)
    expect(removeExercise(base, 9)).toBe(base)
    expect(moveExercise(base, 0, 9)).toBe(base)
  })
})

describe('exercise operations', () => {
  const base = createSession({ place: 'gym', routine: PUSH_DAY }, ctx())

  it('adds an exercise with defaults and removes one', () => {
    const s = addExercise(base, 'squat', ctx())
    expect(s.entries.at(-1)).toMatchObject({ exerciseId: 'squat', restSec: 90 })
    expect(s.entries.at(-1)!.sets).toHaveLength(3)
    expect(removeExercise(s, 0).entries.map((e) => e.exerciseId)).toEqual(['plank', 'push-up', 'squat'])
  })

  it('reorders exercises', () => {
    expect(moveExercise(base, 0, 2).entries.map((e) => e.exerciseId)).toEqual(['plank', 'push-up', 'bench'])
    expect(moveExercise(base, 2, 0).entries.map((e) => e.exerciseId)).toEqual(['push-up', 'bench', 'plank'])
  })

  it('updates rest and note of an entry', () => {
    expect(updateEntry(base, 1, { restSec: 30, note: 'slow' }).entries[1]).toMatchObject({ restSec: 30, note: 'slow' })
  })

  it('swaps keeping the set count and rest, re-prefilling, recording the original', () => {
    const history = [done('2026-10-01', [['db-bench', [set(30, 12)]]])]
    const s = swapExercise(base, 0, 'db-bench', ctx(history))
    expect(s.entries[0]).toMatchObject({ exerciseId: 'db-bench', swappedFrom: 'bench', restSec: 120 })
    expect(s.entries[0]!.sets.map((x) => [x.weight, x.reps])).toEqual([[30, 12], [30, 12], [30, 12]])

    const again = swapExercise(s, 0, 'push-up', ctx())
    expect(again.entries[0]!.swappedFrom).toBe('bench')
    const back = swapExercise(again, 0, 'bench', ctx())
    expect(back.entries[0]!.swappedFrom).toBeUndefined()
  })
})

describe('finishSession', () => {
  it('drops sets not done and entries left empty, stamps endedAt and records PRs', () => {
    const history = [done('2026-10-01', [['bench', [set(80, 5)]]])]
    let s = createSession({ place: 'gym', routine: PUSH_DAY }, ctx(history))
    expect(hasDoneSets(s)).toBe(false)
    s = toggleSetDone(updateSet(s, 0, 0, { weight: 90 }), 0, 0, 10)
    s = toggleSetDone(s, 0, 1, 20)
    expect(hasDoneSets(s)).toBe(true)

    const finished = finishSession(s, history, lookup, 99)
    expect(finished).toMatchObject({ status: 'done', endedAt: 99, prs: ['bench'] })
    expect(finished.entries.map((e) => [e.exerciseId, e.sets.length])).toEqual([['bench', 2]])
    expect(s.status).toBe('active')
  })
})

describe('nextRoutine', () => {
  const program: UserProgram = { id: 'p', name: 'P', place: 'gym', routineIds: ['a', 'b', 'c'], createdAt: 0 }
  const routines = [routine('c'), routine('a'), routine('b')]
  const finishedOn = (day: string, routineId: string, programId = 'p') => done(day, [], { routineId, programId })

  it('starts with the first routine', () => {
    expect(nextRoutine(program, routines, [])?.id).toBe('a')
  })

  it('follows the most recent finished routine of this program and wraps around', () => {
    expect(nextRoutine(program, routines, [finishedOn('2026-10-02', 'b'), finishedOn('2026-10-01', 'a')])?.id).toBe('c')
    expect(nextRoutine(program, routines, [finishedOn('2026-10-03', 'c')])?.id).toBe('a')
  })

  it('ignores other programs, active sessions and routines no longer in the program', () => {
    const sessions = [
      finishedOn('2026-10-01', 'a'),
      finishedOn('2026-10-05', 'b', 'other'),
      { ...finishedOn('2026-10-06', 'b'), status: 'active' as const },
      finishedOn('2026-10-07', 'gone'),
    ]
    expect(nextRoutine(program, routines, sessions)?.id).toBe('b')
  })

  it('skips missing routines and returns null for an empty program', () => {
    expect(nextRoutine(program, [routine('a'), routine('c')], [finishedOn('2026-10-01', 'a')])?.id).toBe('c')
    expect(nextRoutine({ ...program, routineIds: [] }, routines, [])).toBeNull()
  })
})
