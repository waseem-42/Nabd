import { uid } from '@/i18n/format'
import { MUSCLE_TO_GROUP } from '@/types'
import type {
  ExerciseLookup,
  ExerciseMode,
  LoggedSet,
  Place,
  Routine,
  RoutineItem,
  SessionEntry,
  UserProgram,
  WorkoutSession,
} from '@/types'
import { type BodyProfile, progressSets, suggestStartWeight, wantsWarmup, warmupSets } from './loading'
import { detectPRs, lastPerformance } from './progress'

/*
 * Pure, immutable operations on a WorkoutSession. Every function returns a new session and
 * leaves its input untouched; out-of-range indexes return the session unchanged.
 */

/** What building or re-prefilling an entry needs to know. */
export interface PrefillContext {
  lookup: ExerciseLookup
  /** Finished sessions (any order) — the source of "last time" values. */
  history: WorkoutSession[]
  /** Settings.restSec, used when a routine item has no restSec. */
  defaultRestSec: number
  /** Body weight, background and unit — for starting weights and progression steps. */
  profile?: BodyProfile
  /** Prepend ramp-up sets to the first heavy lift of each muscle group in a new session. */
  autoWarmup?: boolean
}

/** Rest after a ramp-up set: they're light, so waiting the full working rest wastes time. */
export const WARMUP_REST_SEC = 45

export const DEFAULT_SET_COUNT = 3

/** Starting values for a never-done exercise without targets. */
const MODE_DEFAULTS: Record<ExerciseMode, Pick<LoggedSet, 'weight' | 'reps' | 'sec'>> = {
  reps: { weight: 0, reps: 10 },
  time: { weight: 0, reps: 0, sec: 30 },
  cardio: { weight: 0, reps: 0, sec: 600 },
}

function freshSet(values: Pick<LoggedSet, 'weight' | 'reps' | 'sec'>): LoggedSet {
  const set: LoggedSet = { weight: values.weight, reps: values.reps, kind: 'normal', done: false }
  if (values.sec !== undefined) set.sec = values.sec
  return set
}

/**
 * `count` sets for the exercise: the values from the last time it was done (set by set, the
 * last one repeating) — one step heavier when every target was hit — else the routine
 * targets with a starting weight from body weight, else the defaults for its mode.
 */
function prefillSets(
  exerciseId: string,
  count: number,
  item: RoutineItem | undefined,
  ctx: PrefillContext,
): { sets: LoggedSet[]; source?: SessionEntry['prefill'] } {
  const exercise = ctx.lookup(exerciseId)
  const last = lastPerformance(ctx.history, exerciseId)?.sets
  if (last?.length) {
    const progressed = exercise && ctx.profile ? progressSets(last, exercise, item?.reps, ctx.profile.unit) : null
    const base = progressed ?? last
    return {
      sets: Array.from({ length: count }, (_, i) => freshSet(base[Math.min(i, base.length - 1)]!)),
      source: progressed ? 'progress' : undefined,
    }
  }
  const mode = exercise?.mode ?? 'reps'
  const defaults = MODE_DEFAULTS[mode]
  const start = exercise ? suggestStartWeight(exercise, ctx.profile) : null
  const values = {
    weight: start ?? defaults.weight,
    reps: item?.reps ?? defaults.reps,
    sec: item?.sec ?? defaults.sec,
  }
  return { sets: Array.from({ length: count }, () => freshSet(values)), source: start ? 'body' : undefined }
}

export function buildEntry(exerciseId: string, ctx: PrefillContext, item?: RoutineItem): SessionEntry {
  const { sets, source } = prefillSets(exerciseId, item?.sets ?? DEFAULT_SET_COUNT, item, ctx)
  const entry: SessionEntry = { exerciseId, sets, restSec: item?.restSec ?? ctx.defaultRestSec }
  if (source) entry.prefill = source
  return entry
}

/** The ramp-up sets the entry's first working set calls for (empty when none apply). */
export function warmupFor(entry: SessionEntry, ctx: Pick<PrefillContext, 'lookup' | 'profile'>): LoggedSet[] {
  const exercise = ctx.lookup(entry.exerciseId)
  const first = entry.sets.find((s) => s.kind === 'normal')
  if (!exercise || !first || !(first.weight > 0) || !wantsWarmup(exercise)) return []
  return warmupSets(first.weight, exercise.equipment, ctx.profile?.unit ?? 'kg')
}

/** Puts ramp-up sets in front of an entry that has none yet. */
export function addWarmups(session: WorkoutSession, entryIndex: number, ctx: Pick<PrefillContext, 'lookup' | 'profile'>): WorkoutSession {
  return mapEntry(session, entryIndex, (e) => {
    if (e.sets.some((s) => s.kind === 'warmup')) return e
    const ramp = warmupFor(e, ctx)
    return ramp.length ? { ...e, sets: [...ramp, ...e.sets] } : e
  })
}

export interface NewSessionOptions {
  place: Place
  /** Omit for a quick, empty session. */
  routine?: Routine
  programId?: string
  /** Defaults to the routine's name, else ''. Screens show a localized "Quick workout" for ''. */
  name?: string
  now?: number
}

/** A new active session. Items that don't fit `place` are kept — the screen offers a swap. */
export function createSession(opts: NewSessionOptions, ctx: PrefillContext): WorkoutSession {
  const session: WorkoutSession = {
    id: uid(),
    status: 'active',
    place: opts.place,
    name: opts.name ?? opts.routine?.name ?? '',
    startedAt: opts.now ?? Date.now(),
    entries: (opts.routine?.items ?? []).map((item) => buildEntry(item.exerciseId, ctx, item)),
  }
  if (ctx.autoWarmup) {
    // Only the first heavy lift per muscle group: later ones are already warm.
    const warmed = new Set<string>()
    session.entries = session.entries.map((entry) => {
      const exercise = ctx.lookup(entry.exerciseId)
      if (!exercise || warmed.has(MUSCLE_TO_GROUP[exercise.primary])) return entry
      const ramp = warmupFor(entry, ctx)
      if (!ramp.length) return entry
      warmed.add(MUSCLE_TO_GROUP[exercise.primary])
      return { ...entry, sets: [...ramp, ...entry.sets] }
    })
  }
  if (opts.routine) session.routineId = opts.routine.id
  if (opts.programId) session.programId = opts.programId
  return session
}

// ── Entries ─────────────────────────────────────────────────────────────────────────────────

function mapEntry(session: WorkoutSession, index: number, fn: (e: SessionEntry) => SessionEntry): WorkoutSession {
  const entry = session.entries[index]
  if (!entry) return session
  return { ...session, entries: session.entries.map((e, i) => (i === index ? fn(entry) : e)) }
}

export function addExercise(session: WorkoutSession, exerciseId: string, ctx: PrefillContext): WorkoutSession {
  return { ...session, entries: [...session.entries, buildEntry(exerciseId, ctx)] }
}

export function removeExercise(session: WorkoutSession, entryIndex: number): WorkoutSession {
  if (!session.entries[entryIndex]) return session
  return { ...session, entries: session.entries.filter((_, i) => i !== entryIndex) }
}

/** Moves the entry at `from` so it ends up at index `to`. */
export function moveExercise(session: WorkoutSession, from: number, to: number): WorkoutSession {
  const entry = session.entries[from]
  if (!entry || to < 0 || to >= session.entries.length || from === to) return session
  const entries = session.entries.filter((_, i) => i !== from)
  entries.splice(to, 0, entry)
  return { ...session, entries }
}

export function updateEntry(
  session: WorkoutSession,
  entryIndex: number,
  patch: Partial<Pick<SessionEntry, 'restSec' | 'note'>>,
): WorkoutSession {
  return mapEntry(session, entryIndex, (e) => ({ ...e, ...patch }))
}

/**
 * Replaces the entry's exercise, keeping its set count, rest and note. The sets are prefilled
 * again for the new exercise. `swappedFrom` keeps the original id; swapping back clears it.
 */
export function swapExercise(
  session: WorkoutSession,
  entryIndex: number,
  exerciseId: string,
  ctx: PrefillContext,
): WorkoutSession {
  return mapEntry(session, entryIndex, (e) => {
    const original = e.swappedFrom ?? e.exerciseId
    const next: SessionEntry = {
      ...e,
      exerciseId,
      sets: prefillSets(exerciseId, Math.max(1, e.sets.filter((x) => x.kind === 'normal').length), undefined, ctx).sets,
    }
    delete next.prefill
    if (original === exerciseId) delete next.swappedFrom
    else next.swappedFrom = original
    return next
  })
}

// ── Sets ────────────────────────────────────────────────────────────────────────────────────

function mapSet(
  session: WorkoutSession,
  entryIndex: number,
  setIndex: number,
  fn: (s: LoggedSet) => LoggedSet,
): WorkoutSession {
  const set = session.entries[entryIndex]?.sets[setIndex]
  if (!set) return session
  return mapEntry(session, entryIndex, (e) => ({
    ...e,
    sets: e.sets.map((s, i) => (i === setIndex ? fn(set) : s)),
  }))
}

/** Appends a copy of the last set (not done), or defaults when the entry has no sets. */
export function addSet(session: WorkoutSession, entryIndex: number, ctx: PrefillContext): WorkoutSession {
  return mapEntry(session, entryIndex, (e) => {
    const last = e.sets.at(-1)
    const set = last ? freshSet(last) : prefillSets(e.exerciseId, 1, undefined, ctx).sets[0]!
    return { ...e, sets: [...e.sets, set] }
  })
}

export function removeSet(session: WorkoutSession, entryIndex: number, setIndex: number): WorkoutSession {
  if (!session.entries[entryIndex]?.sets[setIndex]) return session
  return mapEntry(session, entryIndex, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== setIndex) }))
}

export type SetPatch = Partial<Pick<LoggedSet, 'weight' | 'reps' | 'sec' | 'kind'>>

export function updateSet(session: WorkoutSession, entryIndex: number, setIndex: number, patch: SetPatch): WorkoutSession {
  return mapSet(session, entryIndex, setIndex, (s) => ({ ...s, ...patch }))
}

/**
 * Like updateSet, but the new weight / reps / time also flows to the sets after it that are
 * still to do, of the same kind, and held the value this set had — so changing the first set
 * of "3 × 60 kg" changes all three, while a set the user set differently is left alone.
 */
export function updateSetCarry(session: WorkoutSession, entryIndex: number, setIndex: number, patch: SetPatch): WorkoutSession {
  const before = session.entries[entryIndex]?.sets[setIndex]
  if (!before) return session
  const fields = (['weight', 'reps', 'sec'] as const).filter((f) => patch[f] !== undefined && patch[f] !== before[f])
  return mapEntry(session, entryIndex, (e) => ({
    ...e,
    sets: e.sets.map((s, i) => {
      if (i === setIndex) return { ...s, ...patch }
      if (i < setIndex || s.done || s.kind !== before.kind) return s
      const carried = fields.filter((f) => s[f] === before[f])
      return carried.length ? { ...s, ...Object.fromEntries(carried.map((f) => [f, patch[f]])) } : s
    }),
  }))
}

/** Marks a set done (stamping doneAt) or not done again. */
export function toggleSetDone(session: WorkoutSession, entryIndex: number, setIndex: number, now = Date.now()): WorkoutSession {
  return mapSet(session, entryIndex, setIndex, (s) => {
    if (s.done) {
      const { doneAt: _doneAt, ...rest } = s
      return { ...rest, done: false }
    }
    return { ...s, done: true, doneAt: now }
  })
}

// ── Finishing ───────────────────────────────────────────────────────────────────────────────

export function hasDoneSets(session: WorkoutSession): boolean {
  return session.entries.some((e) => e.sets.some((s) => s.done))
}

/**
 * Closes the session: keeps only done sets and entries that still have one, stamps endedAt
 * and records the exercises that set a personal record against `earlier` sessions.
 */
export function finishSession(
  session: WorkoutSession,
  earlier: WorkoutSession[],
  lookup: ExerciseLookup,
  now = Date.now(),
): WorkoutSession {
  const entries = session.entries
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
    .filter((e) => e.sets.length > 0)
  const finished: WorkoutSession = { ...session, status: 'done', endedAt: now, entries }
  return { ...finished, prs: detectPRs(finished, earlier, lookup) }
}

// ── Program rotation ────────────────────────────────────────────────────────────────────────

/**
 * The routine after the one most recently finished in this program, wrapping around; the
 * first routine when none was finished yet. Routines removed from the program are skipped.
 * null for a program without routines.
 */
export function nextRoutine(program: UserProgram, routines: Routine[], doneSessions: WorkoutSession[]): Routine | null {
  const byId = new Map(routines.map((r) => [r.id, r]))
  const order = program.routineIds.filter((id) => byId.has(id))
  if (!order.length) return null

  let last: WorkoutSession | undefined
  for (const s of doneSessions) {
    if (s.status !== 'done' || s.programId !== program.id || !s.routineId || !order.includes(s.routineId)) continue
    if (!last || s.startedAt > last.startedAt) last = s
  }
  const index = last?.routineId ? (order.indexOf(last.routineId) + 1) % order.length : 0
  return byId.get(order[index]!) ?? null
}
