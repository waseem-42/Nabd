import { describe, expect, it } from 'vitest'
import { ACCESSORIES, EQUIPMENT, MUSCLES } from '@/types'
import type { ExerciseKind, ExerciseMode, Level, ProgramTemplate, RawExercise, RawExerciseAr } from '@/types'
import rawExercises from './exercises.json'
import rawAr from './exercises.ar.json'
import rawPrograms from './programs.json'

const exercises = rawExercises as unknown as RawExercise[]
const ar = rawAr as unknown as RawExerciseAr
const programs = rawPrograms as unknown as ProgramTemplate[]
const byId = new Map(exercises.map((e) => [e.id, e]))

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const KINDS: ExerciseKind[] = ['strength', 'calisthenics', 'cardio', 'stretch', 'sport']
const MODES: ExerciseMode[] = ['reps', 'time', 'cardio']

describe('exercise catalogue', () => {
  it('is a real catalogue with unique ids', () => {
    expect(exercises.length).toBeGreaterThan(400)
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length)
  })

  it('uses only the allowed vocabulary', () => {
    for (const e of exercises) {
      const w = `${e.id} (${e.name})`
      expect(e.name.trim(), w).not.toBe('')
      expect(MUSCLES, w).toContain(e.primary)
      for (const s of e.secondary) {
        expect(MUSCLES, w).toContain(s)
        expect(s, w).not.toBe(e.primary)
      }
      expect(EQUIPMENT, w).toContain(e.equipment)
      for (const n of e.needs) expect(ACCESSORIES, w).toContain(n)
      expect(LEVELS, w).toContain(e.level)
      expect(KINDS, w).toContain(e.kind)
      expect(MODES, w).toContain(e.mode)
      expect(Array.isArray(e.steps), w).toBe(true)
      expect(e.art === null || /^[a-z0-9][a-z0-9-]*$/i.test(e.art), `${w}: art slug`).toBe(true)
    }
  })

  it('has a bodyweight-only home subset large enough to train with', () => {
    const fit = exercises.filter((e) => e.equipment === 'bodyweight' && e.needs.length === 0)
    expect(fit.length).toBeGreaterThan(50)
  })
})

describe('Arabic names', () => {
  it('has an entry for every exercise id and nothing extra', () => {
    expect(Object.keys(ar).sort()).toEqual(exercises.map((e) => e.id).sort())
    for (const e of exercises) {
      expect(typeof ar[e.id]?.name, e.id).toBe('string')
      expect(Array.isArray(ar[e.id]?.steps), e.id).toBe(true)
    }
  })

  it('names a good share of the catalogue', () => {
    const named = exercises.filter((e) => ar[e.id]?.name)
    expect(named.length).toBeGreaterThan(150)
    for (const e of named) expect(/[؀-ۿ]/.test(ar[e.id]?.name ?? ''), `${e.id} is not Arabic`).toBe(true)
  })
})

describe('program templates', () => {
  it('has unique ids and at least 3 home and 3 gym programs', () => {
    expect(new Set(programs.map((p) => p.id)).size).toBe(programs.length)
    expect(programs.filter((p) => p.place === 'home').length).toBeGreaterThanOrEqual(3)
    expect(programs.filter((p) => p.place === 'gym').length).toBeGreaterThanOrEqual(3)
  })

  it('has bilingual text, valid levels and consistent day counts', () => {
    for (const p of programs) {
      expect(p.name.en && p.name.ar, p.id).toBeTruthy()
      expect(p.description.en && p.description.ar, p.id).toBeTruthy()
      expect(LEVELS, p.id).toContain(p.level)
      expect(['home', 'gym'], p.id).toContain(p.place)
      expect(p.days.length, p.id).toBe(p.daysPerWeek)
      expect(p.days.length, p.id).toBeGreaterThan(0)
      for (const d of p.days) {
        expect(d.name.en && d.name.ar, p.id).toBeTruthy()
        expect(d.items.length, `${p.id}/${d.name.en}`).toBeGreaterThan(0)
      }
    }
  })

  it('references only catalogue exercises with a target that fits their mode', () => {
    for (const p of programs) {
      for (const d of p.days) {
        for (const it of d.items) {
          const ex = byId.get(it.exerciseId)
          expect(ex, `${p.id}: unknown exercise ${it.exerciseId}`).toBeDefined()
          expect(Number.isInteger(it.sets) && it.sets > 0, `${p.id}/${it.exerciseId} sets`).toBe(true)
          if (ex!.mode === 'reps') {
            expect(Number.isInteger(it.reps), `${p.id}/${it.exerciseId} reps`).toBe(true)
            expect(it.sec).toBeUndefined()
          } else {
            expect(Number.isInteger(it.sec), `${p.id}/${it.exerciseId} sec`).toBe(true)
            expect(it.reps).toBeUndefined()
          }
        }
      }
    }
  })

  it('marks a program as home only when it needs no gym equipment', () => {
    for (const p of programs) {
      const equipment = new Set(p.days.flatMap((d) => d.items.map((it) => byId.get(it.exerciseId)!.equipment)))
      if (p.place === 'gym') expect(equipment.size, p.id).toBeGreaterThan(0)
      else {
        // home programs are bodyweight, except the one that is explicitly a dumbbell program
        const allowed = p.id === 'home-dumbbell' ? ['bodyweight', 'dumbbell'] : ['bodyweight']
        for (const eq of equipment) expect(allowed, `${p.id} uses ${eq}`).toContain(eq)
      }
    }
  })
})
