/**
 * Nabd data contracts. Every module (db, domain, store, ui, screens, scripts) builds on these
 * types — change them here first, never redefine them locally.
 *
 * Conventions:
 *  - weights are ALWAYS stored in kilograms; convert only when displaying (see i18n/format.ts)
 *  - timestamps are epoch milliseconds; calendar days are ISO strings 'YYYY-MM-DD' (local time)
 *  - ids of bundled exercises/programs come from the catalogue; user-created rows use uid()
 */

export type Lang = 'ar' | 'en'
export type Unit = 'kg' | 'lb'

/** Where the user trains. Drives which exercises and programs are offered. */
export type Place = 'home' | 'gym'

export interface L10n {
  en: string
  ar: string
}

// ── Catalogue vocabulary ────────────────────────────────────────────────────────────────────

export const MUSCLES = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearm', 'trapezius', 'back', 'lowerback',
  'abdomen', 'obliques', 'glutes', 'quads', 'hamstrings', 'calves',
] as const
export type Muscle = (typeof MUSCLES)[number]

/** Coarse grouping used by the library filter chips. */
export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'] as const
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]

export const MUSCLE_TO_GROUP: Record<Muscle, MuscleGroup> = {
  chest: 'chest',
  back: 'back',
  lowerback: 'back',
  trapezius: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearm: 'arms',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  abdomen: 'core',
  obliques: 'core',
}

export const EQUIPMENT = [
  'bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'band', 'kettlebell', 'weighted',
  'rings', 'other',
] as const
export type Equipment = (typeof EQUIPMENT)[number]

/** Extra kit an exercise needs on top of its equipment (a "bodyweight" pull-up needs a bar). */
export const ACCESSORIES = ['bench', 'pullup-bar'] as const
export type Accessory = (typeof ACCESSORIES)[number]

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type ExerciseKind = 'strength' | 'calisthenics' | 'cardio' | 'stretch' | 'sport'

/** How a set of this exercise is measured: weight×reps, a timed hold, or cardio minutes. */
export type ExerciseMode = 'reps' | 'time' | 'cardio'

export interface Exercise {
  id: string
  name: L10n
  primary: Muscle
  secondary: Muscle[]
  equipment: Equipment
  needs: Accessory[]
  level: Level
  kind: ExerciseKind
  mode: ExerciseMode
  /** Art slug → `/art/<slug>.json` (see ArtFile). null when the exercise has no illustration. */
  art: string | null
  /** Numbered how-to steps. `ar` may be empty until translated — fall back to `en`. */
  steps: { en: string[]; ar: string[] }
  /** true for exercises the user added (stored in the db, not the bundled catalogue). */
  custom?: boolean
}

/** Finds an exercise by id across the bundled catalogue and the user's custom exercises. */
export type ExerciseLookup = (id: string) => Exercise | undefined

/** Shape of `public/art/<slug>.json`: one SVG path `d` string per animation frame. */
export interface ArtFile {
  /** [minX, minY, width, height] covering all frames. */
  viewBox: [number, number, number, number]
  frames: string[]
}

// ── Raw catalogue files (output of scripts/build-catalog.mjs, merged by data/catalog.ts) ───

/** One row of `src/data/exercises.json`. English only. */
export interface RawExercise {
  id: string
  name: string
  primary: Muscle
  secondary: Muscle[]
  equipment: Equipment
  needs: Accessory[]
  level: Level
  kind: ExerciseKind
  mode: ExerciseMode
  art: string | null
  steps: string[]
}

/** `src/data/exercises.ar.json`: exercise id → Arabic name and steps (steps may be []). */
export type RawExerciseAr = Record<string, { name: string; steps: string[] }>

// ── Routines and programs ───────────────────────────────────────────────────────────────────

export interface RoutineItem {
  exerciseId: string
  sets: number
  /** Target reps per set (mode 'reps'). */
  reps?: number
  /** Target seconds per set (mode 'time') or minutes×60 (mode 'cardio'). */
  sec?: number
  /** Rest after each set in seconds; falls back to Settings.restSec when absent. */
  restSec?: number
}

/** A bundled ready-made program (`src/data/programs.json`). Read-only. */
export interface ProgramTemplate {
  id: string
  name: L10n
  description: L10n
  place: Place
  level: Level
  daysPerWeek: number
  days: { name: L10n; items: RoutineItem[] }[]
}

/** One training day the user owns: copied from a template day or built from scratch. */
export interface Routine {
  id: string
  name: string
  place: Place
  items: RoutineItem[]
  createdAt: number
  updatedAt: number
}

/**
 * The user's program: an ordered rotation of routines. "Next workout" is the routine after
 * the last finished one, wrapping around — no weekday scheduling.
 */
export interface UserProgram {
  id: string
  name: string
  place: Place
  /** Set when the program was started from a bundled template. */
  templateId?: string
  routineIds: string[]
  createdAt: number
}

// ── Workout sessions ────────────────────────────────────────────────────────────────────────

export type SetKind = 'normal' | 'warmup'

export interface LoggedSet {
  /** Kilograms. 0 for pure bodyweight. */
  weight: number
  reps: number
  /** Seconds held / cardio duration, for 'time' and 'cardio' exercises. */
  sec?: number
  kind: SetKind
  done: boolean
  doneAt?: number
}

export interface SessionEntry {
  exerciseId: string
  sets: LoggedSet[]
  restSec: number
  /** Original exercise id when the user swapped it for an alternative mid-session. */
  swappedFrom?: string
  /**
   * Where the prefilled numbers came from, so the screen can explain them: 'progress' = last
   * time plus one step (every target was hit), 'body' = a starting weight from body weight.
   */
  prefill?: 'progress' | 'body'
  note?: string
}

export interface WorkoutSession {
  id: string
  /** At most one session is 'active' at a time; it survives reloads. */
  status: 'active' | 'done'
  place: Place
  name: string
  routineId?: string
  programId?: string
  startedAt: number
  endedAt?: number
  entries: SessionEntry[]
  /** Exercise ids that hit a personal record in this session (filled when finishing). */
  prs?: string[]
}

export interface BodyWeightEntry {
  /** ISO day 'YYYY-MM-DD'; one entry per day (primary key). */
  day: string
  kg: number
}

// ── Settings ────────────────────────────────────────────────────────────────────────────────

export interface Settings {
  lang: Lang
  unit: Unit
  /** Current training place — the big Home/Gym switch. */
  place: Place
  /** Default rest between sets, seconds. */
  restSec: number
  /** What the user has at home. 'bodyweight' is always available and need not be listed. */
  homeEquipment: Equipment[]
  homeAccessories: Accessory[]
  activeProgramId: string | null
  sound: boolean
  onboarded: boolean
  /** Training background: scales suggested starting weights and the warm-up length. */
  level: Level
  /** Optional; with body weight it picks joint-friendly warm-ups. */
  heightCm: number | null
  /** Add ramp-up sets before the first heavy lift of each muscle group. */
  autoWarmup: boolean
  /** Keep the screen on during a workout (where the browser allows it). */
  keepAwake: boolean
  /** Short vibrations when a set is done and when rest ends. */
  haptics: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'ar',
  unit: 'kg',
  place: 'home',
  restSec: 90,
  homeEquipment: ['bodyweight'],
  homeAccessories: [],
  activeProgramId: null,
  sound: true,
  onboarded: false,
  level: 'beginner',
  heightCm: null,
  autoWarmup: true,
  keepAwake: true,
  haptics: true,
}

/** Full local backup file (Settings → export / import). */
export interface BackupFile {
  app: 'nabd'
  version: 1
  exportedAt: number
  settings: Settings
  routines: Routine[]
  programs: UserProgram[]
  sessions: WorkoutSession[]
  bodyWeights: BodyWeightEntry[]
  customExercises: Exercise[]
}
