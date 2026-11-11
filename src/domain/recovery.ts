import { MUSCLE_GROUPS, MUSCLE_TO_GROUP, type ExerciseLookup, type MuscleGroup, type WorkoutSession } from '@/types'

/*
 * Rough readiness per muscle group from when it last did work sets: a main mover needs about
 * 72 hours, a helper about 48. This is a planning hint, not a physiological measurement.
 */

const PRIMARY_H = 72
const SECONDARY_H = 48

export interface Readiness {
  group: MuscleGroup
  /** 0 = just trained … 1 = fully rested (or never trained). */
  value: number
  /** Hours since the group last worked; null when never. */
  hoursSince: number | null
}

export function muscleReadiness(sessions: WorkoutSession[], lookup: ExerciseLookup, now = Date.now()): Readiness[] {
  const value = new Map<MuscleGroup, number>(MUSCLE_GROUPS.map((g) => [g, 1]))
  const since = new Map<MuscleGroup, number>()
  for (const session of sessions) {
    if (session.status !== 'done') continue
    const at = session.endedAt ?? session.startedAt
    const hours = (now - at) / 3_600_000
    if (hours < 0 || hours > PRIMARY_H) continue
    for (const entry of session.entries) {
      if (!entry.sets.some((s) => s.done && s.kind === 'normal')) continue
      const exercise = lookup(entry.exerciseId)
      if (!exercise) continue
      const touch = (group: MuscleGroup, full: number) => {
        value.set(group, Math.min(value.get(group)!, Math.min(1, hours / full)))
        since.set(group, Math.min(since.get(group) ?? Infinity, hours))
      }
      touch(MUSCLE_TO_GROUP[exercise.primary], PRIMARY_H)
      for (const m of exercise.secondary) touch(MUSCLE_TO_GROUP[m], SECONDARY_H)
    }
  }
  return MUSCLE_GROUPS.map((group) => ({
    group,
    value: Math.round(value.get(group)! * 100) / 100,
    hoursSince: since.has(group) ? Math.round(since.get(group)!) : null,
  }))
}
