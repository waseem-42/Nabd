import Dexie, { type EntityTable } from 'dexie'
import type { BodyWeightEntry, Routine, UserProgram, WorkoutSession } from '@/types'

/** The on-device database. Settings are not here — they live in localStorage (store/settings). */
export const db = new Dexie('nabd') as Dexie & {
  routines: EntityTable<Routine, 'id'>
  programs: EntityTable<UserProgram, 'id'>
  sessions: EntityTable<WorkoutSession, 'id'>
  bodyWeights: EntityTable<BodyWeightEntry, 'day'>
}

db.version(1).stores({
  routines: 'id',
  programs: 'id',
  sessions: 'id, status, startedAt, routineId, programId',
  bodyWeights: 'day',
  customExercises: 'id',
})

// Version 2 drops user-added exercises: every exercise in Nabd comes with a motion.
// Past sessions that used one keep its id and show a placeholder name.
db.version(2).stores({ customExercises: null })

export const ALL_TABLES = [db.routines, db.programs, db.sessions, db.bodyWeights]
