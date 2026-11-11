import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCISES } from '@/data/catalog'
import { done, ex } from '@/domain/testFixtures'
import { deleteBodyWeight, listBodyWeights, upsertBodyWeight } from './bodyWeights'
import {
  createCustomExercise,
  deleteCustomExercise,
  listCustomExercises,
  loadExerciseLookup,
  updateCustomExercise,
} from './customExercises'
import { ALL_TABLES } from './db'
import { deleteSession, getSession, listDoneSessions, saveSession } from './sessions'

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
})

describe('body weights', () => {
  it('keeps one entry per day, oldest first', async () => {
    await upsertBodyWeight('2026-11-02', 80)
    await upsertBodyWeight('2026-11-01', 81)
    await upsertBodyWeight('2026-11-02', 79.5)
    expect(await listBodyWeights()).toEqual([
      { day: '2026-11-01', kg: 81 },
      { day: '2026-11-02', kg: 79.5 },
    ])
    await deleteBodyWeight('2026-11-01')
    expect(await listBodyWeights()).toEqual([{ day: '2026-11-02', kg: 79.5 }])
  })
})

describe('custom exercises', () => {
  it('creates, updates, deletes and joins the lookup', async () => {
    const { id: _id, ...input } = ex('ignored', { name: { en: 'Towel row', ar: 'تجديف' } })
    const created = await createCustomExercise(input)
    expect(created).toMatchObject({ custom: true, name: { en: 'Towel row' } })
    expect(created.id).toMatch(/^custom-/)

    await updateCustomExercise(created.id, { level: 'advanced' })
    expect((await listCustomExercises())[0]?.level).toBe('advanced')

    const lookup = await loadExerciseLookup()
    expect(lookup(created.id)?.name.en).toBe('Towel row')
    expect(lookup(EXERCISES[0]!.id)).toBe(EXERCISES[0])

    await deleteCustomExercise(created.id)
    expect(await listCustomExercises()).toEqual([])
  })
})

describe('sessions', () => {
  it('lists only finished sessions, newest first', async () => {
    const old = done('2026-10-01', [])
    const recent = done('2026-10-05', [])
    await saveSession(recent)
    await saveSession(old)
    await saveSession({ ...done('2026-10-09', []), status: 'active' })
    expect((await listDoneSessions()).map((s) => s.id)).toEqual([recent.id, old.id])
    await deleteSession(old.id)
    expect(await getSession(old.id)).toBeUndefined()
  })
})
