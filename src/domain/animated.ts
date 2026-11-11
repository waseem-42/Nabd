import { RIGS } from '@/motion/engine'
import type { Exercise, Place } from '@/types'
import { fitsPlace, type HomeGear } from './place'

/** Exercises with a continuous joint animation: the app's library is built from these. */
export const ANIMATED_IDS: ReadonlySet<string> = new Set(RIGS.map((rig) => rig.exerciseId))
export const isAnimated = (id: string) => ANIMATED_IDS.has(id)

/** Animated exercises that can be done at `place` with the user's home gear. */
export function animatedFor(all: Exercise[], place: Place, gear: HomeGear): Exercise[] {
  return all.filter((exercise) => isAnimated(exercise.id) && fitsPlace(exercise, place, gear))
}
