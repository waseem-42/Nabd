import { EXERCISE_BY_ID } from '@/data/catalog'
import { uid } from '@/i18n/format'
import type { Exercise, ExerciseLookup } from '@/types'
import { db } from './db'

export type CustomExerciseInput = Omit<Exercise, 'id' | 'custom'>

export function listCustomExercises(): Promise<Exercise[]> {
  return db.customExercises.toArray()
}

export async function createCustomExercise(input: CustomExerciseInput): Promise<Exercise> {
  const exercise: Exercise = { ...input, id: `custom-${uid()}`, custom: true }
  await db.customExercises.add(exercise)
  return exercise
}

export async function updateCustomExercise(id: string, patch: Partial<CustomExerciseInput>): Promise<void> {
  await db.customExercises.update(id, patch)
}

/** Past sessions keep the id; screens should show a fallback name for unknown ids. */
export async function deleteCustomExercise(id: string): Promise<void> {
  await db.customExercises.delete(id)
}

/** Lookup over the bundled catalogue plus the user's custom exercises (for non-React code). */
export async function loadExerciseLookup(): Promise<ExerciseLookup> {
  const custom = new Map((await listCustomExercises()).map((e) => [e.id, e]))
  return (id) => EXERCISE_BY_ID.get(id) ?? custom.get(id)
}
