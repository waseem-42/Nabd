import { beforeEach, describe, expect, it } from 'vitest'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { done, ex, set } from '@/domain/testFixtures'
import { useWorkout } from '@/store/session'
import { getSettings, useSettings } from '@/store/settings'
import { DEFAULT_SETTINGS } from '@/types'
import { BackupError, exportBackup, importBackup, readBackupFile } from './backup'
import { listBodyWeights, upsertBodyWeight } from './bodyWeights'
import { ALL_TABLES } from './db'
import { createRoutine, listPrograms, listRoutines, startProgramFromTemplate } from './routines'
import { getActiveSession, listDoneSessions, saveSession } from './sessions'

async function seed() {
  await startProgramFromTemplate(PROGRAM_TEMPLATES[0]!.id, 'en')
  await createRoutine({ name: 'Extra', place: 'home', items: [{ exerciseId: 'push-up', sets: 2 }] })
  await saveSession(done('2026-10-01', [['bench', [set(80, 5)]]]))
  await saveSession({ ...done('2026-10-02', [['bench', [set(85, 5, { done: false })]]]), status: 'active' })
  await upsertBodyWeight('2026-10-01', 80)
  await upsertBodyWeight('2026-10-02', 79.5)
  useSettings.getState().set({ lang: 'en', unit: 'lb', place: 'gym', restSec: 120 })
}

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
  useSettings.getState().replace(DEFAULT_SETTINGS)
  useWorkout.setState({ session: null, rest: null, hydrated: false })
})

describe('backup round-trip', () => {
  it('exports everything and restores it exactly after the device is wiped', async () => {
    await seed()
    const backup = await exportBackup()
    expect(backup).toMatchObject({ app: 'nabd', version: 1 })
    expect(backup.sessions).toHaveLength(2)

    // Through JSON, as a real file would be.
    const file = new File([JSON.stringify(backup)], 'b.json', { type: 'application/json' })

    await Promise.all(ALL_TABLES.map((t) => t.clear()))
    useSettings.getState().replace(DEFAULT_SETTINGS)
    await createRoutine({ name: 'Will be replaced', place: 'gym', items: [] })

    await importBackup(await readBackupFile(file))

    const again = await exportBackup()
    expect({ ...again, exportedAt: 0 }).toEqual({ ...backup, exportedAt: 0 })
    expect(getSettings()).toMatchObject({ lang: 'en', unit: 'lb', restSec: 120 })
    expect((await listRoutines()).map((r) => r.name)).not.toContain('Will be replaced')
    expect(await listPrograms()).toHaveLength(1)
    expect(await listDoneSessions()).toHaveLength(1)
    expect(await listBodyWeights()).toHaveLength(2)
    // The restored active session is picked up by the workout store.
    expect(useWorkout.getState().session?.id).toBe((await getActiveSession())?.id)
  })
})

describe('importBackup validation', () => {
  const valid = async () => JSON.parse(JSON.stringify(await exportBackup())) as Record<string, unknown>

  it.each([
    ['not an object', 42, 'not-nabd'],
    ['another app', { app: 'other', version: 1 }, 'not-nabd'],
    ['a newer version', { app: 'nabd', version: 2 }, 'unsupported-version'],
  ])('rejects %s', async (_label, data, code) => {
    await expect(importBackup(data)).rejects.toMatchObject({ name: 'BackupError', code })
  })

  it('rejects missing or malformed tables and changes nothing', async () => {
    await seed()
    const before = await exportBackup()
    const bad = [
      { ...(await valid()), routines: undefined },
      { ...(await valid()), sessions: [{ id: 's', status: 'weird', entries: [] }] },
      { ...(await valid()), bodyWeights: [{ day: '2026-01-01', kg: '80' }] },
      { ...(await valid()), settings: null },
    ]
    for (const data of bad) {
      const err = await importBackup(data).catch((e: unknown) => e)
      expect(err).toBeInstanceOf(BackupError)
      expect((err as BackupError).code).toBe('invalid')
    }
    expect({ ...(await exportBackup()), exportedAt: 0 }).toEqual({ ...before, exportedAt: 0 })
  })

  it('still restores a backup made before user-added exercises were removed', async () => {
    await seed()
    const old = { ...(await valid()), customExercises: [{ ...ex('custom-1'), custom: true }] }
    await Promise.all(ALL_TABLES.map((t) => t.clear()))
    await importBackup(old)
    expect(await listDoneSessions()).toHaveLength(1)
    expect(await listBodyWeights()).toHaveLength(2)
    expect(await exportBackup()).not.toHaveProperty('customExercises')
  })

  it('reports a file that is not JSON', async () => {
    const file = new File(['{oops'], 'b.json')
    await expect(readBackupFile(file)).rejects.toMatchObject({ code: 'not-json' })
  })
})
