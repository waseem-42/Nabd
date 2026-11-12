import { uid } from '@/i18n/format'
import { MUSCLE_TO_GROUP } from '@/types'
import type {
  ExerciseLookup,
  ExerciseMode,
  Goal,
  LoggedSet,
  Place,
  Routine,
  RoutineItem,
  SessionEntry,
  UserProgram,
  WorkoutSession,
} from '@/types'
import { deloadItem, itemForGoal } from './goal'
import { type BodyProfile, progressSets, roundLoad, suggestStartWeight, wantsWarmup, warmupSets } from './loading'
import { detectPRs, lastPerformance, startOfWeek } from './progress'

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
  /** Adjusts a routine's targets when a session is created (default: muscle, as written). */
  goal?: Goal
  /** The program's deload week: fewer sets and about 10% lighter. */
  deload?: boolean
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
  // Deload sessions are light on purpose; progress continues from the last normal one.
  const last = (lastPerformance(ctx.history.filter((s) => !s.deload), exerciseId) ?? lastPerformance(ctx.history, exerciseId))?.sets
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
    entries: (opts.routine?.items ?? []).map((raw) => {
      let item = itemForGoal(raw, ctx.lookup(raw.exerciseId), ctx.goal ?? 'muscle')
      if (ctx.deload) item = deloadItem(item)
      const entry = buildEntry(item.exerciseId, ctx, item)
      return ctx.deload && opts.routine ? lighten(entry, ctx) : entry
    }),
  }
  if (ctx.deload && opts.routine) session.deload = true
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

/** Deload: about 10% less weight (rounded down to a loadable step), or a quarter fewer reps without load. */
function lighten(entry: SessionEntry, ctx: PrefillContext): SessionEntry {
  const exercise = ctx.lookup(entry.exerciseId)
  if (!exercise || exercise.mode !== 'reps') return entry
  const unit = ctx.profile?.unit ?? 'kg'
  return {
    ...entry,
    prefill: 'deload',
    sets: entry.sets.map((s) =>
      s.weight > 0
        ? { ...s, weight: roundLoad(s.weight * 0.9, exercise.equipment, unit, 'down') }
        : { ...s, reps: Math.max(1, Math.round(s.reps * 0.75)) },
    ),
  }
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

/**
 * A routine's items with `from` replaced by `to` for good (the "always" answer to a swap).
 * Sets and rest stay; the target switches between reps and seconds if the new move is measured differently.
 */
export function replaceInRoutine(items: RoutineItem[], from: string, to: string, lookup: ExerciseLookup): RoutineItem[] {
  const timed = (lookup(to)?.mode ?? 'reps') !== 'reps'
  return items.map((item) => {
    if (item.exerciseId !== from) return item
    const next: RoutineItem = { ...item, exerciseId: to }
    if (timed && next.sec === undefined) {
      delete next.reps
      next.sec = 30
    } else if (!timed && next.reps === undefined) {
      delete next.sec
      next.reps = 10
    }
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

export interface PlanPosition {
  /** 1-based position of the next routine in the rotation. */
  day: number
  total: number
  /** 1-based calendar week since the first workout of the current block (1 before any). */
  week: number
  /** Block length, or null for an open-ended program. */
  weeks: number | null
  /** The block's last week, done lighter. */
  deload: boolean
  /** Every week of the block is behind: time to repeat it or move up. */
  finished: boolean
  /** Finished workouts of this program in the current block. */
  sessions: WorkoutSession[]
}

/**
 * Where the user stands in the program: "Day 2 of 3 · Week 4 of 8". Weeks count from the first
 * workout on or after `cycleStart`, so restarting a block starts again at week 1. null without routines.
 */
export function planPosition(
  program: UserProgram,
  routines: Routine[],
  doneSessions: WorkoutSession[],
  now = Date.now(),
  weeks: number | null = program.weeks ?? null,
): PlanPosition | null {
  const next = nextRoutine(program, routines, doneSessions)
  if (!next) return null
  const known = new Set(routines.map((r) => r.id))
  const order = program.routineIds.filter((id) => known.has(id))
  const since = program.cycleStart ?? 0
  const sessions = doneSessions.filter((s) => s.status === 'done' && s.programId === program.id && s.startedAt >= since)
  const first = sessions.length ? Math.min(...sessions.map((s) => s.startedAt)) : null
  const elapsed = first === null ? 0 : Math.round((startOfWeek(now).getTime() - startOfWeek(first).getTime()) / (7 * 86_400_000))
  const week = Math.max(0, elapsed) + 1
  return {
    day: order.indexOf(next.id) + 1,
    total: order.length,
    week,
    weeks,
    deload: weeks !== null && week === weeks,
    finished: weeks !== null && week > weeks,
    sessions,
  }
}
