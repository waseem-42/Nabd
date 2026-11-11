// Shared test data for domain/db/store tests. Not imported by app code.
import type { Exercise, LoggedSet, WorkoutSession } from '@/types'

export function ex(id: string, patch: Partial<Exercise> = {}): Exercise {
  return {
    id,
    name: { en: id, ar: id },
    primary: 'chest',
    secondary: [],
    equipment: 'bodyweight',
    needs: [],
    level: 'beginner',
    kind: 'strength',
    mode: 'reps',
    art: null,
    steps: { en: [], ar: [] },
    ...patch,
  }
}

export const BENCH = ex('bench', { equipment: 'barbell', needs: ['bench'], secondary: ['triceps', 'shoulders'], level: 'intermediate' })
export const DB_BENCH = ex('db-bench', { equipment: 'dumbbell', needs: ['bench'], secondary: ['triceps'], level: 'intermediate' })
export const PUSH_UP = ex('push-up', { kind: 'calisthenics', secondary: ['triceps', 'shoulders'] })
export const BAND_FLY = ex('band-fly', { equipment: 'band', secondary: ['shoulders'] })
export const DIPS = ex('dips', { primary: 'triceps', secondary: ['chest'], kind: 'calisthenics', level: 'intermediate' })
export const PLANK = ex('plank', { primary: 'abdomen', mode: 'time', kind: 'calisthenics' })
export const PULL_UP = ex('pull-up', { primary: 'back', needs: ['pullup-bar'], kind: 'calisthenics' })
export const CALF_RAISE = ex('calf-raise', { primary: 'calves' })
export const SQUAT = ex('squat', { primary: 'quads', equipment: 'barbell' })

export const ALL = [BENCH, DB_BENCH, PUSH_UP, BAND_FLY, DIPS, PLANK, PULL_UP, CALF_RAISE, SQUAT]
const BY_ID = new Map(ALL.map((e) => [e.id, e]))
export const lookup = (id: string) => BY_ID.get(id)

export function set(weight: number, reps: number, patch: Partial<LoggedSet> = {}): LoggedSet {
  return { weight, reps, kind: 'normal', done: true, ...patch }
}

let n = 0
/** A finished session; `day` is a local date 'YYYY-MM-DD' (started 18:00, one hour long). */
export function done(day: string, entries: [exerciseId: string, sets: LoggedSet[]][], patch: Partial<WorkoutSession> = {}): WorkoutSession {
  const startedAt = new Date(`${day}T18:00:00`).getTime()
  return {
    id: `s${++n}`,
    status: 'done',
    place: 'gym',
    name: 'Test',
    startedAt,
    endedAt: startedAt + 3600_000,
    entries: entries.map(([exerciseId, sets]) => ({ exerciseId, sets, restSec: 90 })),
    ...patch,
  }
}
