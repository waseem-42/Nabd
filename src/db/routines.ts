import { PROGRAM_TEMPLATE_BY_ID } from '@/data/catalog'
import { uid } from '@/i18n/format'
import { getSettings, useSettings } from '@/store/settings'
import type { Lang, Place, Routine, RoutineItem, UserProgram } from '@/types'
import { db } from './db'

// ── Routines ────────────────────────────────────────────────────────────────────────────────

export interface RoutineInput {
  name: string
  place: Place
  items: RoutineItem[]
}

export function listRoutines(): Promise<Routine[]> {
  return db.routines.toArray().then(byCreatedAt)
}

export function getRoutine(id: string): Promise<Routine | undefined> {
  return db.routines.get(id)
}

export async function createRoutine(input: RoutineInput): Promise<Routine> {
  const now = Date.now()
  const routine: Routine = { id: uid(), ...input, createdAt: now, updatedAt: now }
  await db.routines.add(routine)
  return routine
}

export async function updateRoutine(id: string, patch: Partial<RoutineInput>): Promise<void> {
  await db.routines.update(id, { ...patch, updatedAt: Date.now() })
}

/** Deletes the routine and drops it from every program's rotation. Past sessions are kept. */
export async function deleteRoutine(id: string): Promise<void> {
  await db.transaction('rw', db.routines, db.programs, async () => {
    await db.routines.delete(id)
    await db.programs
      .filter((p) => p.routineIds.includes(id))
      .modify((p) => {
        p.routineIds = p.routineIds.filter((r) => r !== id)
      })
  })
}

// ── Programs ────────────────────────────────────────────────────────────────────────────────

export interface ProgramInput {
  name: string
  place: Place
  routineIds: string[]
}

export function listPrograms(): Promise<UserProgram[]> {
  return db.programs.toArray().then(byCreatedAt)
}

export function getProgram(id: string): Promise<UserProgram | undefined> {
  return db.programs.get(id)
}

/**
 * Copies every day of a bundled template into a Routine (named in `lang`), creates the
 * program and makes it the active one.
 */
export async function startProgramFromTemplate(templateId: string, lang: Lang): Promise<UserProgram> {
  const template = PROGRAM_TEMPLATE_BY_ID.get(templateId)
  if (!template) throw new Error(`Unknown program template: ${templateId}`)

  const now = Date.now()
  const routines: Routine[] = template.days.map((day, i) => ({
    id: uid(),
    name: day.name[lang],
    place: template.place,
    items: day.items.map((item) => ({ ...item })),
    // Distinct timestamps keep the template's day order when routines are listed.
    createdAt: now + i,
    updatedAt: now + i,
  }))
  const program: UserProgram = {
    id: uid(),
    name: template.name[lang],
    place: template.place,
    templateId,
    routineIds: routines.map((r) => r.id),
    createdAt: now,
  }

  await db.transaction('rw', db.routines, db.programs, async () => {
    await db.routines.bulkAdd(routines)
    await db.programs.add(program)
  })
  followProgram(program)
  return program
}

/** Makes `program` the one followed at its place (and the legacy active one). */
export function followProgram(program: Pick<UserProgram, 'id' | 'place'>): void {
  useSettings.getState().set({
    activeProgramId: program.id,
    ...(program.place === 'home' ? { homeProgramId: program.id } : { gymProgramId: program.id }),
  })
}

export async function createProgram(input: ProgramInput): Promise<UserProgram> {
  const program: UserProgram = { id: uid(), ...input, createdAt: Date.now() }
  await db.programs.add(program)
  return program
}

export async function updateProgram(id: string, patch: Partial<ProgramInput>): Promise<void> {
  await db.programs.update(id, patch)
}

/**
 * Deletes the program and the routines only it uses (routines shared with another program
 * stay). Clears `activeProgramId` when it pointed here. Past sessions are kept.
 */
export async function deleteProgram(id: string): Promise<void> {
  await db.transaction('rw', db.routines, db.programs, async () => {
    const program = await db.programs.get(id)
    if (!program) return
    const others = await db.programs.filter((p) => p.id !== id).toArray()
    const shared = new Set(others.flatMap((p) => p.routineIds))
    await db.routines.bulkDelete(program.routineIds.filter((r) => !shared.has(r)))
    await db.programs.delete(id)
  })
  const settings = getSettings()
  const patch: Partial<typeof settings> = {}
  if (settings.activeProgramId === id) patch.activeProgramId = null
  if (settings.homeProgramId === id) patch.homeProgramId = null
  if (settings.gymProgramId === id) patch.gymProgramId = null
  if (Object.keys(patch).length) useSettings.getState().set(patch)
}

/** The program with its routines in rotation order (missing ids are skipped). */
export async function getProgramWithRoutines(
  id: string,
): Promise<{ program: UserProgram; routines: Routine[] } | null> {
  const program = await db.programs.get(id)
  if (!program) return null
  const found = await db.routines.bulkGet(program.routineIds)
  return { program, routines: found.filter((r): r is Routine => r !== undefined) }
}

function byCreatedAt<T extends { createdAt: number }>(rows: T[]): T[] {
  return rows.sort((a, b) => a.createdAt - b.createdAt)
}
