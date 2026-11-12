import type { Exercise, Goal, RoutineItem } from '@/types'

/*
 * The training goal turns one program into three: strength works heavier for fewer reps with
 * longer rests, fitness does more reps with short rests, muscle keeps the program as written.
 */

/** The rest (seconds) suggested when a goal is picked. The user can still change it. */
export const GOAL_REST: Record<Goal, number> = { strength: 120, muscle: 60, fitness: 30 }

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

/**
 * A routine item's targets under a goal. Strength only lowers reps on loaded lifts: fewer
 * reps of a push-up don't make it heavier. Fitness raises reps and holds for everything.
 */
export function itemForGoal(item: RoutineItem, exercise: Pick<Exercise, 'mode' | 'equipment'> | undefined, goal: Goal): RoutineItem {
  if (goal === 'muscle' || !exercise) return item
  if (exercise.mode === 'reps' && item.reps !== undefined) {
    if (goal === 'strength') return exercise.equipment === 'bodyweight' ? item : { ...item, reps: Math.min(6, Math.max(4, Math.round(item.reps * 0.6))) }
    return { ...item, reps: Math.round(item.reps * 1.4) }
  }
  if (exercise.mode !== 'reps' && item.sec !== undefined && goal === 'fitness') return { ...item, sec: roundTo5(item.sec * 1.25) }
  return item
}

/** Deload week: one set fewer (at least two) — the lighter weights are applied to the prefilled sets. */
export function deloadItem(item: RoutineItem): RoutineItem {
  return { ...item, sets: Math.max(2, item.sets - 1) }
}
