import Dexie, { type EntityTable } from 'dexie'
import type { BodyWeightEntry, Exercise, Routine, UserProgram, WorkoutSession } from '@/types'

/** The on-device database. Settings are not here — they live in localStorage (store/settings). */
export const db = new Dexie('nabd') as Dexie & {
  routines: EntityTable<Routine, 'id'>
  programs: EntityTable<UserProgram, 'id'>
  sessions: EntityTable<WorkoutSession, 'id'>
  bodyWeights: EntityTable<BodyWeightEntry, 'day'>
  customExercises: EntityTable<Exercise, 'id'>
}

db.version(1).stores({
  routines: 'id',
  programs: 'id',
  sessions: 'id, status, startedAt, routineId, programId',
  bodyWeights: 'day',
  customExercises: 'id',
})

export const ALL_TABLES = [db.routines, db.programs, db.sessions, db.bodyWeights, db.customExercises]
