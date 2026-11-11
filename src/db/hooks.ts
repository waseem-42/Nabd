import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { EXERCISES, EXERCISE_BY_ID } from '@/data/catalog'
import { useSettings } from '@/store/settings'
import type { BodyWeightEntry, Exercise, ExerciseLookup, Routine, UserProgram, WorkoutSession } from '@/types'
import { listBodyWeights } from './bodyWeights'
import { db } from './db'
import { getProgramWithRoutines, listPrograms, listRoutines } from './routines'
import { getSession, listDoneSessions } from './sessions'

/*
 * Live queries: each hook re-renders when the underlying rows change.
 * `undefined` always means "still loading"; `null` means "loaded, not found".
 */

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(listRoutines, [])
}

export function useRoutine(id: string | undefined): Routine | null | undefined {
  return useLiveQuery(async () => (id ? ((await db.routines.get(id)) ?? null) : null), [id])
}

export function usePrograms(): UserProgram[] | undefined {
  return useLiveQuery(listPrograms, [])
}

/** The program in `settings.activeProgramId`, with its routines in rotation order. */
export function useActiveProgram(): { program: UserProgram; routines: Routine[] } | null | undefined {
  const id = useSettings((s) => s.activeProgramId)
  return useLiveQuery(async () => (id ? getProgramWithRoutines(id) : null), [id])
}

/** Finished sessions, newest first. */
export function useDoneSessions(): WorkoutSession[] | undefined {
  return useLiveQuery(listDoneSessions, [])
}

export function useSession(id: string | undefined): WorkoutSession | null | undefined {
  return useLiveQuery(async () => (id ? ((await getSession(id)) ?? null) : null), [id])
}

/** Oldest first. */
export function useBodyWeights(): BodyWeightEntry[] | undefined {
  return useLiveQuery(listBodyWeights, [])
}

export interface AllExercises {
  /** Bundled catalogue followed by the user's custom exercises. */
  exercises: Exercise[]
  /** Covers both bundled and custom ids. */
  byId: ExerciseLookup
}

/** Never loading: the bundled catalogue is available at once and customs join when read. */
export function useAllExercises(): AllExercises {
  const custom = useLiveQuery(() => db.customExercises.toArray(), [])
  return useMemo(() => {
    const list = custom ?? []
    const customById = new Map(list.map((e) => [e.id, e]))
    return {
      exercises: list.length ? [...EXERCISES, ...list] : EXERCISES,
      byId: (id: string) => EXERCISE_BY_ID.get(id) ?? customById.get(id),
    }
  }, [custom])
}
