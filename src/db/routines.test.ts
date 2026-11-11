import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { getSettings, useSettings } from '@/store/settings'
import { DEFAULT_SETTINGS } from '@/types'
import { ALL_TABLES } from './db'
import {
  createProgram,
  createRoutine,
  deleteProgram,
  deleteRoutine,
  getProgram,
  getProgramWithRoutines,
  getRoutine,
  listPrograms,
  listRoutines,
  startProgramFromTemplate,
  updateProgram,
  updateRoutine,
} from './routines'

beforeEach(async () => {
  await Promise.all(ALL_TABLES.map((t) => t.clear()))
  useSettings.getState().replace(DEFAULT_SETTINGS)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('startProgramFromTemplate', () => {
  const template = PROGRAM_TEMPLATES[0]!

  it('copies every day into a routine named in the chosen language and activates the program', async () => {
    const program = await startProgramFromTemplate(template.id, 'ar')
    expect(program).toMatchObject({ name: template.name.ar, place: template.place, templateId: template.id })
    expect(getSettings().activeProgramId).toBe(program.id)

    const loaded = await getProgramWithRoutines(program.id)
    expect(loaded?.routines.map((r) => r.name)).toEqual(template.days.map((d) => d.name.ar))
    expect(loaded?.routines.map((r) => r.items)).toEqual(template.days.map((d) => d.items))
    expect(loaded?.routines.every((r) => r.place === template.place)).toBe(true)
  })

  it('uses English names for lang en, and copies items rather than sharing them', async () => {
    const program = await startProgramFromTemplate(template.id, 'en')
    const [first] = (await getProgramWithRoutines(program.id))!.routines
    expect(first!.name).toBe(template.days[0]!.name.en)
    expect(first!.items[0]).not.toBe(template.days[0]!.items[0])
  })

  it('rejects an unknown template', async () => {
    await expect(startProgramFromTemplate('nope', 'en')).rejects.toThrow('nope')
  })
})

describe('routines', () => {
  it('creates, lists in creation order and updates', async () => {
    vi.useFakeTimers({ now: 1000, toFake: ['Date'] })
    const a = await createRoutine({ name: 'A', place: 'home', items: [{ exerciseId: 'x', sets: 3 }] })
    vi.setSystemTime(2000)
    const b = await createRoutine({ name: 'B', place: 'gym', items: [] })
    vi.setSystemTime(3000)
    await updateRoutine(a.id, { name: 'A2' })
    expect((await getRoutine(a.id))?.name).toBe('A2')
    expect((await getRoutine(a.id))!.updatedAt).toBe(3000)
    expect((await listRoutines()).map((r) => r.id)).toEqual([a.id, b.id])
  })

  it('removes a deleted routine from program rotations', async () => {
    const a = await createRoutine({ name: 'A', place: 'gym', items: [] })
    const b = await createRoutine({ name: 'B', place: 'gym', items: [] })
    const p = await createProgram({ name: 'P', place: 'gym', routineIds: [a.id, b.id] })
    await deleteRoutine(a.id)
    expect(await getRoutine(a.id)).toBeUndefined()
    expect((await getProgram(p.id))?.routineIds).toEqual([b.id])
  })
})

describe('programs', () => {
  it('creates and updates a custom program', async () => {
    const r = await createRoutine({ name: 'A', place: 'home', items: [] })
    const p = await createProgram({ name: 'Mine', place: 'home', routineIds: [] })
    await updateProgram(p.id, { routineIds: [r.id], name: 'Mine 2' })
    expect(await listPrograms()).toEqual([{ ...p, name: 'Mine 2', routineIds: [r.id] }])
  })

  it('deletes the program with its own routines, keeps shared ones, clears the active id', async () => {
    const shared = await createRoutine({ name: 'S', place: 'gym', items: [] })
    const own = await createRoutine({ name: 'O', place: 'gym', items: [] })
    const p = await createProgram({ name: 'P', place: 'gym', routineIds: [shared.id, own.id] })
    await createProgram({ name: 'Q', place: 'gym', routineIds: [shared.id] })
    useSettings.getState().set({ activeProgramId: p.id })

    await deleteProgram(p.id)
    expect(await getProgram(p.id)).toBeUndefined()
    expect(await getRoutine(own.id)).toBeUndefined()
    expect(await getRoutine(shared.id)).toBeDefined()
    expect(getSettings().activeProgramId).toBeNull()
  })
})
