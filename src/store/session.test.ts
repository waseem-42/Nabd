import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_TABLES } from '@/db/db'
import { getActiveSession, getSession, listDoneSessions, saveSession } from '@/db/sessions'
import { done, set } from '@/domain/testFixtures'
import { DEFAULT_SETTINGS, type Routine } from '@/types'
import { initApp, restRemainingSec, useWorkout } from './session'
import { useSettings } from './settings'

// Ids are not in the bundled catalogue on purpose: the store must cope with unknown ids.
const PUSH: Routine = {
  id: 'r1',
  name: 'Push',
  place: 'gym',
  items: [
    { exerciseId: 'bench', sets: 3, reps: 8, restSec: 120 },
    { exerciseId: 'plank', sets: 2, sec: 30 },
  ],
  createdAt: 0,
  updatedAt: 0,
}

const store = () => useWorkout.getState()

/** Waits until the database copy of the active session satisfies `check`. */
async function persisted(check: (entries: NonNullable<Awaited<ReturnType<typeof getActiveSession>>>) => void) {
  await vi.waitFor(async () => {
    const s = await getActiveSession()
    expect(s).toBeDefined()
    check(s!)
  })
}

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
  localStorage.clear()
  useSettings.getState().replace({ ...DEFAULT_SETTINGS, place: 'gym', restSec: 75 })
  useWorkout.setState({ session: null, hydrated: false, rest: null })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('workout store', () => {
  it('hydrates to no session on a fresh device', async () => {
    await initApp()
    expect(store()).toMatchObject({ session: null, hydrated: true })
  })

  it('starts a session at the current place, prefilled from history, and persists it', async () => {
    await saveSession(done('2026-10-01', [['bench', [set(60, 8)]]]))
    const s = await store().start({ routine: PUSH, programId: 'p1' })
    expect(s).toMatchObject({ place: 'gym', routineId: 'r1', programId: 'p1', status: 'active' })
    expect(s.entries[0]!.sets[0]).toMatchObject({ weight: 60, reps: 8 })
    expect((await getActiveSession())?.id).toBe(s.id)
    await expect(store().start()).rejects.toThrow('already active')
  })

  it('toggling a set done starts rest with the Settings rest; undoing does not', async () => {
    await store().start({ routine: PUSH })
    store().toggleSet(0, 0)
    expect(store().rest?.totalSec).toBe(75)
    store().skipRest()
    store().toggleSet(0, 0)
    useSettings.getState().set({ restSec: 45 })
    store().toggleSet(0, 0)
    expect(store().rest?.totalSec).toBe(45)
    store().skipRest()
    store().toggleSet(0, 0)
    expect(store().rest).toBeNull()
  })

  it('runs the rest timer from timestamps', () => {
    vi.useFakeTimers({ now: 1_000_000 })
    store().startRest()
    expect(store().rest).toEqual({ endsAt: 1_075_000, totalSec: 75 })
    store().addRest(15)
    expect(restRemainingSec(store().rest)).toBe(90)
    vi.setSystemTime(1_080_000)
    expect(restRemainingSec(store().rest)).toBe(10)
    store().addRest(-30)
    expect(store().rest).toBeNull()
    expect(restRemainingSec(null)).toBe(0)
  })

  it('survives a reload mid-workout, rest timer included', async () => {
    await store().start({ routine: PUSH })
    store().updateSet(0, 0, { weight: 70 })
    store().toggleSet(0, 0)
    await store().addExercise('push-up')
    store().moveExercise(2, 0)
    await persisted((s) => {
      expect(s.entries.map((e) => e.exerciseId)).toEqual(['push-up', 'bench', 'plank'])
      expect(s.entries[1]!.sets[0]).toMatchObject({ weight: 70, done: true })
    })
    const before = store()

    // A reload: fresh modules (new store, new Dexie connection) over the same storage.
    vi.resetModules()
    const fresh = await import('./session')
    expect(fresh.useWorkout.getState()).toMatchObject({ session: null, hydrated: false })
    await fresh.initApp()
    const after = fresh.useWorkout.getState()
    expect(after.hydrated).toBe(true)
    expect(after.session).toEqual(before.session)
    expect(after.rest).toEqual(before.rest)

    // And keeps working after the reload.
    after.toggleSet(1, 1)
    await persisted((s) => expect(s.entries[1]!.sets[1]!.done).toBe(true))
  })

  it('drops an expired rest timer on hydrate', async () => {
    await store().start()
    useWorkout.setState({ rest: { endsAt: Date.now() - 1000, totalSec: 60 } })
    await store().hydrate()
    expect(store().rest).toBeNull()
  })

  it('finishes: saves the cleaned session as done, records PRs and clears the store', async () => {
    await saveSession(done('2026-10-01', [['bench', [set(60, 8)]]]))
    await store().start({ routine: PUSH })
    store().updateSet(0, 0, { weight: 65 })
    store().toggleSet(0, 0)
    const id = await store().finish()

    expect(store()).toMatchObject({ session: null, rest: null })
    const saved = await getSession(id)
    expect(saved).toMatchObject({ status: 'done', prs: ['bench'] })
    expect(saved?.endedAt).toBeTypeOf('number')
    expect(saved?.entries.map((e) => [e.exerciseId, e.sets.length])).toEqual([['bench', 1]])
    expect(await getActiveSession()).toBeUndefined()
    expect(await listDoneSessions()).toHaveLength(2)
  })

  it('swaps an exercise and keeps the set count', async () => {
    await store().start({ routine: PUSH })
    await store().swapExercise(0, 'db-bench')
    expect(store().session?.entries[0]).toMatchObject({ exerciseId: 'db-bench', swappedFrom: 'bench' })
    expect(store().session?.entries[0]!.sets).toHaveLength(3)
  })

  it('discards without saving', async () => {
    await store().start({ routine: PUSH })
    store().toggleSet(0, 0)
    await store().discard()
    expect(store()).toMatchObject({ session: null, rest: null })
    expect(await getActiveSession()).toBeUndefined()
    expect(await listDoneSessions()).toHaveLength(0)
  })
})
