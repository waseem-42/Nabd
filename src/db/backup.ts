import { useWorkout } from '@/store/session'
import { getSettings, useSettings } from '@/store/settings'
import type { BackupFile } from '@/types'
import { isoDay } from '@/i18n/format'
import { ALL_TABLES, db } from './db'

export type BackupErrorCode = 'not-json' | 'not-nabd' | 'unsupported-version' | 'invalid'

/** Thrown for a file that is not a usable Nabd backup; nothing has been changed. */
export class BackupError extends Error {
  readonly code: BackupErrorCode
  constructor(code: BackupErrorCode, message: string) {
    super(message)
    this.name = 'BackupError'
    this.code = code
  }
}

export async function exportBackup(): Promise<BackupFile> {
  const [routines, programs, sessions, bodyWeights] = await Promise.all([
    db.routines.toArray(),
    db.programs.toArray(),
    db.sessions.toArray(),
    db.bodyWeights.toArray(),
  ])
  return {
    app: 'nabd',
    version: 1,
    exportedAt: Date.now(),
    settings: getSettings(),
    routines,
    programs,
    sessions,
    bodyWeights,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

type Row = Record<string, unknown>
const rows = (ok: (r: Row) => boolean) => (v: unknown) => Array.isArray(v) && v.every((r) => isObject(r) && ok(r))

const TABLE_CHECKS: [key: keyof BackupFile, valid: (v: unknown) => boolean][] = [
  ['routines', rows((r) => typeof r.id === 'string' && Array.isArray(r.items))],
  ['programs', rows((r) => typeof r.id === 'string' && Array.isArray(r.routineIds))],
  ['sessions', rows((r) => typeof r.id === 'string' && (r.status === 'active' || r.status === 'done') && Array.isArray(r.entries))],
  ['bodyWeights', rows((r) => typeof r.day === 'string' && typeof r.kg === 'number')],
]

/** Throws BackupError unless `data` has the shape of a version-1 backup. */
export function validateBackup(data: unknown): BackupFile {
  if (!isObject(data) || data.app !== 'nabd') throw new BackupError('not-nabd', 'Not a Nabd backup file')
  if (data.version !== 1) throw new BackupError('unsupported-version', `Unsupported backup version: ${String(data.version)}`)
  if (!isObject(data.settings)) throw new BackupError('invalid', 'Backup has no settings')
  for (const [key, valid] of TABLE_CHECKS) {
    if (!valid(data[key])) throw new BackupError('invalid', `Backup has an invalid "${key}" list`)
  }
  return data as unknown as BackupFile
}

/**
 * Replaces everything on the device with the backup: all tables in one transaction, then
 * settings, then the active-session store. Validates first, so a bad file changes nothing.
 */
export async function importBackup(data: unknown): Promise<void> {
  const backup = validateBackup(data)
  await db.transaction('rw', ALL_TABLES, async () => {
    await Promise.all(ALL_TABLES.map((t) => t.clear()))
    await db.routines.bulkPut(backup.routines)
    await db.programs.bulkPut(backup.programs)
    await db.sessions.bulkPut(backup.sessions)
    await db.bodyWeights.bulkPut(backup.bodyWeights)
    // Older backups may carry `customExercises`; user-added exercises are gone, so it is skipped.
  })
  useSettings.getState().replace(backup.settings)
  useWorkout.setState({ session: null, rest: null })
  await useWorkout.getState().hydrate()
}

/** Saves the backup as `nabd-backup-YYYY-MM-DD.json` through the browser's download. */
export function downloadBackup(backup: BackupFile): void {
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `nabd-backup-${isoDay(backup.exportedAt)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Parses a picked file. Throws BackupError('not-json') when it is not JSON. */
export async function readBackupFile(file: File): Promise<unknown> {
  const text = await file.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new BackupError('not-json', 'The file is not valid JSON')
  }
}
