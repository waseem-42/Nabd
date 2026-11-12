import { isoDay } from '@/i18n/format'
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP } from '@/types'
import type { Exercise, ExerciseLookup, LoggedSet, MuscleGroup, RoutineItem, SessionEntry, WorkoutSession } from '@/types'

/*
 * Statistics over finished sessions. Only sets that are done and not warm-ups count
 * ("work sets"); sessions with status 'active' are ignored everywhere.
 */

// ── Single sets and entries ─────────────────────────────────────────────────────────────────

/** Above this many reps an estimate says more about endurance than strength (as openGym). */
export const REP_CAP = 12

/** Epley estimated one-rep max, rounded to 0.1 kg. null when it cannot be estimated honestly. */
export function estimate1RM(weight: number, reps: number): number | null {
  if (!(weight > 0) || !(reps >= 1) || reps > REP_CAP) return null
  const est = reps === 1 ? weight : weight * (1 + Math.round(reps) / 30)
  return Math.round(est * 10) / 10
}

/** What progress means for an exercise: heavier, more reps, or longer. */
export type Metric = 'weight' | 'reps' | 'sec'

export function metricOf(exercise: Pick<Exercise, 'mode' | 'equipment'>): Metric {
  if (exercise.mode !== 'reps') return 'sec'
  return exercise.equipment === 'bodyweight' ? 'reps' : 'weight'
}

export function workSets(entry: SessionEntry): LoggedSet[] {
  return entry.sets.filter((s) => s.done && s.kind === 'normal')
}

/** The set that best represents the entry for the given metric (null without work sets). */
export function bestSet(entry: SessionEntry, metric: Metric): LoggedSet | null {
  const key = (s: LoggedSet): number[] => {
    if (metric === 'sec') return [s.sec ?? 0, s.weight]
    if (metric === 'reps') return [s.reps, s.weight]
    return [estimate1RM(s.weight, s.reps) ?? 0, s.weight, s.reps]
  }
  let best: LoggedSet | null = null
  let bestKey: number[] = []
  for (const s of workSets(entry)) {
    const k = key(s)
    if (!best || isGreater(k, bestKey)) [best, bestKey] = [s, k]
  }
  return best
}

function isGreater(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0)
    if (d !== 0) return d > 0
  }
  return false
}

export function entryVolume(entry: SessionEntry): number {
  return volumeOf(workSets(entry))
}

function volumeOf(sets: LoggedSet[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
}

// ── Sessions ────────────────────────────────────────────────────────────────────────────────

/** Kilograms moved (weight × reps over work sets). */
export function sessionVolume(session: WorkoutSession): number {
  return session.entries.reduce((sum, e) => sum + entryVolume(e), 0)
}

/** Whole seconds from start to end (or to `now` while still active). */
/** Gaps longer than this before the first set or after the last mean the app was left open. */
const IDLE_MS = 20 * 60_000
/** Time allowed for the warm-up before the first set, and for the last set itself. */
const LEAD_MS = 10 * 60_000
const TAIL_MS = 2 * 60_000

/**
 * Training time in whole seconds. Live while active; for a finished session a workout left
 * open for hours is trimmed to its sets (plus a warm-up allowance) instead of counting the wait.
 */
export function sessionDurationSec(session: WorkoutSession, now = Date.now()): number {
  let start = session.startedAt
  let end = session.endedAt ?? now
  if (session.endedAt !== undefined) {
    const stamps = session.entries.flatMap((e) => e.sets.map((s) => s.doneAt)).filter((t): t is number => typeof t === 'number')
    if (stamps.length) {
      const first = Math.min(...stamps)
      const last = Math.max(...stamps)
      if (first - start > IDLE_MS) start = first - LEAD_MS
      if (end - last > IDLE_MS) end = last + TAIL_MS
    }
  }
  return Math.max(0, Math.round((end - start) / 1000))
}

function done(sessions: WorkoutSession[]): WorkoutSession[] {
  return sessions.filter((s) => s.status === 'done')
}

/** All work sets of one exercise in one session (it may appear in more than one entry). */
function setsOf(session: WorkoutSession, exerciseId: string): LoggedSet[] {
  return session.entries.filter((e) => e.exerciseId === exerciseId).flatMap(workSets)
}

/** The newest finished session that has work sets for the exercise — used to prefill. */
export function lastPerformance(
  sessions: WorkoutSession[],
  exerciseId: string,
): { session: WorkoutSession; sets: LoggedSet[] } | null {
  let found: { session: WorkoutSession; sets: LoggedSet[] } | null = null
  for (const session of done(sessions)) {
    if (found && session.startedAt <= found.session.startedAt) continue
    const sets = setsOf(session, exerciseId)
    if (sets.length) found = { session, sets }
  }
  return found
}

// ── Per-exercise history and records ────────────────────────────────────────────────────────

export interface HistoryPoint {
  sessionId: string
  day: string
  startedAt: number
  /** Heaviest work-set weight, kg. */
  topWeight: number
  /** Best estimated 1RM of the session, null when no set could be estimated. */
  e1rm: number | null
  volume: number
  bestReps: number
  bestSec: number
  /** The value to chart for this exercise's metric (see metricOf): e1RM (else top weight), reps or seconds. */
  value: number
}

/** One point per finished session that trained the exercise, oldest first. */
export function exerciseHistory(sessions: WorkoutSession[], exercise: Exercise): HistoryPoint[] {
  const metric = metricOf(exercise)
  const points: HistoryPoint[] = []
  for (const session of done(sessions)) {
    const sets = setsOf(session, exercise.id)
    if (!sets.length) continue
    const r = summarize(sets)
    const value = metric === 'sec' ? r.sec : metric === 'reps' ? r.reps : (r.e1rm ?? r.weight)
    points.push({
      sessionId: session.id,
      day: isoDay(session.startedAt),
      startedAt: session.startedAt,
      topWeight: r.weight,
      e1rm: r.e1rm,
      volume: r.volume,
      bestReps: r.reps,
      bestSec: r.sec,
      value,
    })
  }
  return points.sort((a, b) => a.startedAt - b.startedAt)
}

/** All-time bests of one exercise; each field is the best single value, not one set. */
export interface ExerciseRecords {
  e1rm: number | null
  weight: number
  reps: number
  sec: number
  /** Best single-session volume. */
  volume: number
}

function summarize(sets: LoggedSet[]): ExerciseRecords {
  let e1rm: number | null = null
  for (const s of sets) {
    const est = estimate1RM(s.weight, s.reps)
    if (est !== null && (e1rm === null || est > e1rm)) e1rm = est
  }
  return {
    e1rm,
    weight: Math.max(0, ...sets.map((s) => s.weight)),
    reps: Math.max(0, ...sets.map((s) => s.reps)),
    sec: Math.max(0, ...sets.map((s) => s.sec ?? 0)),
    volume: volumeOf(sets),
  }
}

/** null when the exercise was never trained. */
export function personalRecords(sessions: WorkoutSession[], exerciseId: string): ExerciseRecords | null {
  let best: ExerciseRecords | null = null
  for (const session of done(sessions)) {
    const sets = setsOf(session, exerciseId)
    if (!sets.length) continue
    const r = summarize(sets)
    best = best
      ? {
          e1rm: r.e1rm !== null && (best.e1rm === null || r.e1rm > best.e1rm) ? r.e1rm : best.e1rm,
          weight: Math.max(best.weight, r.weight),
          reps: Math.max(best.reps, r.reps),
          sec: Math.max(best.sec, r.sec),
          volume: Math.max(best.volume, r.volume),
        }
      : r
  }
  return best
}

/**
 * Exercise ids in `session` that beat every earlier finished session on their metric
 * (weight: a higher e1RM or a heavier set; reps: more reps; sec: longer). The first time an
 * exercise is ever done is not a record — there is nothing to beat yet.
 */
export function detectPRs(session: WorkoutSession, earlier: WorkoutSession[], lookup: ExerciseLookup): string[] {
  const history = earlier.filter((s) => s.id !== session.id)
  const ids = [...new Set(session.entries.map((e) => e.exerciseId))]
  return ids.filter((id) => {
    const sets = setsOf(session, id)
    if (!sets.length) return false
    const prev = personalRecords(history, id)
    if (!prev) return false
    const now = summarize(sets)
    const ex = lookup(id)
    const metric = ex ? metricOf(ex) : inferMetric(sets)
    if (metric === 'sec') return now.sec > prev.sec
    if (metric === 'reps') return now.reps > prev.reps
    return (now.e1rm !== null && prev.e1rm !== null && now.e1rm > prev.e1rm) || now.weight > prev.weight
  })
}

/** For ids the lookup no longer knows (a deleted custom exercise). */
function inferMetric(sets: LoggedSet[]): Metric {
  if (sets.some((s) => (s.sec ?? 0) > 0)) return 'sec'
  return sets.some((s) => s.weight > 0) ? 'weight' : 'reps'
}

// ── Weeks, streaks, totals ──────────────────────────────────────────────────────────────────

/** 6 = Saturday, the usual first day of the week in the Arab world (0 = Sunday … 6 = Saturday). */
export const WEEK_STARTS_ON = 6

/** Local midnight of the first day of the week containing `ts`. */
export function startOfWeek(ts: number, weekStartsOn = WEEK_STARTS_ON): Date {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() - weekStartsOn + 7) % 7))
  return d
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

export interface WeekSummary {
  /** The 7 days of the current week in order, each marked when at least one session started that day. */
  days: { day: string; trained: boolean }[]
  /** Finished sessions this week. */
  count: number
}

export function weekSummary(sessions: WorkoutSession[], now = Date.now(), weekStartsOn = WEEK_STARTS_ON): WeekSummary {
  const start = startOfWeek(now, weekStartsOn)
  const days = Array.from({ length: 7 }, (_, i) => isoDay(addDays(start, i)))
  const trained = new Set<string>()
  let count = 0
  for (const s of done(sessions)) {
    const day = isoDay(s.startedAt)
    if (days.includes(day)) {
      trained.add(day)
      count++
    }
  }
  return { days: days.map((day) => ({ day, trained: trained.has(day) })), count }
}

/**
 * Consecutive weeks with at least one finished session. Weeks, not days, because Nabd follows
 * a rotation rather than a weekday schedule — rest days must not break the streak. A current
 * week without training yet does not break it either; it just doesn't count until you train.
 */
export function weekStreak(sessions: WorkoutSession[], now = Date.now(), weekStartsOn = WEEK_STARTS_ON): number {
  const weeks = new Set(done(sessions).map((s) => isoDay(startOfWeek(s.startedAt, weekStartsOn))))
  let week = startOfWeek(now, weekStartsOn)
  if (!weeks.has(isoDay(week))) week = addDays(week, -7)
  let streak = 0
  while (weeks.has(isoDay(week))) {
    streak++
    week = addDays(week, -7)
  }
  return streak
}

export interface Totals {
  sessions: number
  /** Work sets. */
  sets: number
  volume: number
  durationSec: number
}

export function totals(sessions: WorkoutSession[]): Totals {
  const list = done(sessions)
  return {
    sessions: list.length,
    sets: list.reduce((n, s) => n + s.entries.reduce((m, e) => m + workSets(e).length, 0), 0),
    volume: list.reduce((n, s) => n + sessionVolume(s), 0),
    durationSec: list.reduce((n, s) => n + sessionDurationSec(s), 0),
  }
}

// ── Trends for the Today and Progress screens ───────────────────────────────────────────────

export interface WeekPoint {
  /** ISO day of the week's first day. */
  start: string
  count: number
  volume: number
}

/** The last `weeks` weeks including the current one, oldest first. */
export function weeklyHistory(sessions: WorkoutSession[], weeks = 8, now = Date.now(), weekStartsOn = WEEK_STARTS_ON): WeekPoint[] {
  const current = startOfWeek(now, weekStartsOn)
  const points: WeekPoint[] = Array.from({ length: weeks }, (_, i) => ({
    start: isoDay(addDays(current, -7 * (weeks - 1 - i))),
    count: 0,
    volume: 0,
  }))
  const byStart = new Map(points.map((p) => [p.start, p]))
  for (const s of done(sessions)) {
    const point = byStart.get(isoDay(startOfWeek(s.startedAt, weekStartsOn)))
    if (!point) continue
    point.count++
    point.volume += sessionVolume(s)
  }
  return points
}

/** Work sets per muscle group (by each exercise's main muscle) since `since`, biggest first. */
export function muscleSplit(sessions: WorkoutSession[], lookup: ExerciseLookup, since: number): { group: MuscleGroup; sets: number }[] {
  const count = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 0]))
  for (const s of done(sessions)) {
    if (s.startedAt < since) continue
    for (const e of s.entries) {
      const exercise = lookup(e.exerciseId)
      if (!exercise) continue
      const group = MUSCLE_TO_GROUP[exercise.primary]
      count.set(group, count.get(group)! + workSets(e).length)
    }
  }
  return [...count.entries()].map(([group, sets]) => ({ group, sets })).sort((a, b) => b.sets - a.sets)
}

export interface RecordEvent {
  exerciseId: string
  sessionId: string
  startedAt: number
}

/** Personal records in the order they were set, newest first. */
export function recentRecords(sessions: WorkoutSession[], limit = 5): RecordEvent[] {
  return done(sessions)
    .filter((s) => s.prs?.length)
    .sort((a, b) => b.startedAt - a.startedAt)
    .flatMap((s) => s.prs!.map((exerciseId) => ({ exerciseId, sessionId: s.id, startedAt: s.startedAt })))
    .slice(0, limit)
}

// ── This workout against the last one ───────────────────────────────────────────────────────

export interface SessionComparison {
  previous: WorkoutSession
  /** Volume change in percent, rounded; null when the previous session moved no weight. */
  volumePct: number | null
  /** Work sets now minus then. */
  setsDelta: number
  /** Exercises done both times whose best value (by their metric) went up / went down. */
  improved: string[]
  declined: string[]
}

/**
 * The newest earlier finished session of the same routine, and how this one compares.
 * null for a quick workout (no routine) or the first time a routine is done.
 */
export function compareWithPrevious(session: WorkoutSession, history: WorkoutSession[], lookup: ExerciseLookup): SessionComparison | null {
  if (!session.routineId) return null
  let previous: WorkoutSession | undefined
  for (const s of done(history)) {
    if (s.id === session.id || s.routineId !== session.routineId || s.startedAt >= session.startedAt) continue
    if (!previous || s.startedAt > previous.startedAt) previous = s
  }
  if (!previous) return null

  const before = sessionVolume(previous)
  const countSets = (s: WorkoutSession) => s.entries.reduce((n, e) => n + workSets(e).length, 0)
  const improved: string[] = []
  const declined: string[] = []
  for (const id of new Set(session.entries.map((e) => e.exerciseId))) {
    const now = setsOf(session, id)
    const then = setsOf(previous, id)
    if (!now.length || !then.length) continue
    const exercise = lookup(id)
    const metric = exercise ? metricOf(exercise) : inferMetric(now)
    const a = summarize(now)
    const b = summarize(then)
    const value = (r: ExerciseRecords) => (metric === 'sec' ? r.sec : metric === 'reps' ? r.reps : (r.e1rm ?? r.weight))
    if (value(a) > value(b)) improved.push(id)
    else if (value(a) < value(b)) declined.push(id)
  }
  return {
    previous,
    volumePct: before > 0 ? Math.round(((sessionVolume(session) - before) / before) * 100) : null,
    setsDelta: countSets(session) - countSets(previous),
    improved,
    declined,
  }
}

/** Rough length of a routine: ~40 s under the bar per set plus its rest. Whole minutes, at least 5. */
export function routineMinutes(items: Pick<RoutineItem, 'sets' | 'sec' | 'restSec'>[], defaultRestSec: number): number {
  const sec = items.reduce((sum, item) => sum + item.sets * ((item.sec ?? 40) + (item.restSec ?? defaultRestSec)), 0)
  return Math.max(5, Math.round(sec / 300) * 5)
}
