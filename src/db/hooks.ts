import { useLiveQuery } from 'dexie-react-hooks'
import { EXERCISES, exerciseLookup } from '@/data/catalog'
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

/**
 * The program followed at the current place, with its routines in rotation order. Older
 * installs only have `activeProgramId`; it still counts when it belongs to this place.
 */
export function useActiveProgram(): { program: UserProgram; routines: Routine[] } | null | undefined {
  const place = useSettings((s) => s.place)
  const own = useSettings((s) => (s.place === 'home' ? s.homeProgramId : s.gymProgramId))
  const legacy = useSettings((s) => s.activeProgramId)
  return useLiveQuery(async () => {
    for (const id of [own, legacy]) {
      if (!id) continue
      const found = await getProgramWithRoutines(id)
      if (found && found.program.place === place) return found
    }
    return null
  }, [own, legacy, place])
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
  /** The bundled catalogue. */
  exercises: Exercise[]
  byId: ExerciseLookup
}

const ALL_EXERCISES: AllExercises = { exercises: EXERCISES, byId: exerciseLookup }

/** The bundled catalogue; never loading. */
export function useAllExercises(): AllExercises {
  return ALL_EXERCISES
}
