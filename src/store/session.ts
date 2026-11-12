import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { exerciseLookup } from '@/data/catalog'
import { listBodyWeights } from '@/db/bodyWeights'
import { deleteSession, getActiveSession, listDoneSessions, saveSession } from '@/db/sessions'
import * as ops from '@/domain/session'
import type { Routine, SessionEntry, WorkoutSession } from '@/types'
import { getSettings } from './settings'

/** A running rest countdown. Timestamp-based so it keeps time while backgrounded or reloaded. */
export interface RestTimer {
  endsAt: number
  totalSec: number
}

export interface StartOptions {
  /** Omit for a quick, empty session. */
  routine?: Routine
  programId?: string
  name?: string
  /** The program is in its deload week. */
  deload?: boolean
}

interface WorkoutStore {
  /** The active session, or null when not training. */
  session: WorkoutSession | null
  /** false until hydrate() has read the database once. */
  hydrated: boolean
  rest: RestTimer | null

  hydrate: () => Promise<void>
  /** Starts a session at the current place. Throws if one is already active. */
  start: (opts?: StartOptions) => Promise<WorkoutSession>

  addExercise: (exerciseId: string) => Promise<void>
  removeExercise: (entryIndex: number) => void
  moveExercise: (from: number, to: number) => void
  swapExercise: (entryIndex: number, exerciseId: string) => Promise<void>
  updateEntry: (entryIndex: number, patch: Partial<Pick<SessionEntry, 'restSec' | 'note'>>) => void
  addSet: (entryIndex: number) => Promise<void>
  removeSet: (entryIndex: number, setIndex: number) => void
  updateSet: (entryIndex: number, setIndex: number, patch: ops.SetPatch) => void
  /** Marking a set done also starts the rest timer with Settings.restSec. */
  toggleSet: (entryIndex: number, setIndex: number) => void
  /** Puts ramp-up sets in front of the entry (no-op when it has some or needs none). */
  addWarmups: (entryIndex: number) => Promise<void>

  /** Defaults to Settings.restSec. */
  startRest: (sec?: number) => void
  /** Adds (or with a negative delta removes) time; ending at or before now stops the timer. */
  addRest: (deltaSec: number) => void
  skipRest: () => void

  /** Saves the session as done and resolves to its id. */
  finish: () => Promise<string>
  /** Deletes the active session without saving it. */
  discard: () => Promise<void>
}

// Writes go through one queue so they land in the order the mutations happened.
let writes: Promise<unknown> = Promise.resolve()
function persistSession(session: WorkoutSession): Promise<void> {
  const next = writes.then(() => saveSession(session))
  writes = next.catch((err: unknown) => console.error('Saving the session failed', err))
  return next
}
async function flushWrites(): Promise<void> {
  await writes
}

async function prefillContext(): Promise<ops.PrefillContext> {
  const [history, weights] = await Promise.all([listDoneSessions(), listBodyWeights()])
  const settings = getSettings()
  return {
    lookup: exerciseLookup,
    history,
    defaultRestSec: settings.restSec,
    autoWarmup: settings.autoWarmup,
    goal: settings.goal,
    profile: { kg: weights.at(-1)?.kg ?? null, heightCm: settings.heightCm, level: settings.level, unit: settings.unit },
  }
}

export const useWorkout = create<WorkoutStore>()(
  persist(
    (set, get) => {
      /** Applies a pure operation to the active session and persists the result. */
      const apply = (fn: (s: WorkoutSession) => WorkoutSession): WorkoutSession | null => {
        const current = get().session
        if (!current) return null
        const next = fn(current)
        if (next !== current) {
          set({ session: next })
          void persistSession(next)
        }
        return next
      }

      return {
        session: null,
        hydrated: false,
        rest: null,

        hydrate: async () => {
          const session = (await getActiveSession()) ?? null
          const rest = get().rest
          set({
            session,
            hydrated: true,
            rest: session && rest && rest.endsAt > Date.now() ? rest : null,
          })
        },

        start: async (opts = {}) => {
          if (get().session) throw new Error('A workout session is already active')
          const session = ops.createSession({ ...opts, place: getSettings().place }, { ...(await prefillContext()), deload: !!opts.deload })
          set({ session, rest: null })
          await persistSession(session)
          return session
        },

        addExercise: async (exerciseId) => {
          const ctx = await prefillContext()
          apply((s) => ops.addExercise(s, exerciseId, ctx))
        },
        removeExercise: (i) => void apply((s) => ops.removeExercise(s, i)),
        moveExercise: (from, to) => void apply((s) => ops.moveExercise(s, from, to)),
        swapExercise: async (i, exerciseId) => {
          const ctx = await prefillContext()
          apply((s) => ops.swapExercise(s, i, exerciseId, ctx))
        },
        updateEntry: (i, patch) => void apply((s) => ops.updateEntry(s, i, patch)),
        addSet: async (i) => {
          const ctx = await prefillContext()
          apply((s) => ops.addSet(s, i, ctx))
        },
        removeSet: (i, j) => void apply((s) => ops.removeSet(s, i, j)),
        updateSet: (i, j, patch) => void apply((s) => ops.updateSetCarry(s, i, j, patch)),
        toggleSet: (i, j) => {
          const next = apply((s) => ops.toggleSetDone(s, i, j))
          const entry = next?.entries[i]
          const done = entry?.sets[j]
          // The rest length always follows Settings, so changing it there applies right away.
          const rest = getSettings().restSec
          if (entry && done?.done) get().startRest(done.kind === 'warmup' ? Math.min(rest, ops.WARMUP_REST_SEC) : rest)
        },
        addWarmups: async (i) => {
          const ctx = await prefillContext()
          apply((s) => ops.addWarmups(s, i, ctx))
        },

        startRest: (sec = getSettings().restSec) => {
          set({ rest: sec > 0 ? { endsAt: Date.now() + sec * 1000, totalSec: sec } : null })
        },
        addRest: (deltaSec) => {
          const rest = get().rest
          if (!rest) return
          const endsAt = rest.endsAt + deltaSec * 1000
          set({ rest: endsAt > Date.now() ? { endsAt, totalSec: Math.max(1, rest.totalSec + deltaSec) } : null })
        },
        skipRest: () => set({ rest: null }),

        finish: async () => {
          const current = get().session
          if (!current) throw new Error('No active workout session')
          await flushWrites()
          const { lookup, history } = await prefillContext()
          const finished = ops.finishSession(current, history, lookup)
          await persistSession(finished)
          set({ session: null, rest: null })
          return finished.id
        },

        discard: async () => {
          const current = get().session
          if (!current) return
          set({ session: null, rest: null })
          await flushWrites()
          await deleteSession(current.id)
        },
      }
    },
    {
      // Only the rest timer goes to localStorage; the session itself lives in IndexedDB.
      name: 'nabd-rest',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ rest: state.rest }),
    },
  ),
)

/** Whole seconds left on the rest timer (0 when none). */
export function restRemainingSec(rest: RestTimer | null, now = Date.now()): number {
  return rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0
}

/** Call once on boot, before rendering: restores an interrupted workout. */
export async function initApp(): Promise<void> {
  // Ask the browser not to evict the on-device data under storage pressure.
  void navigator.storage?.persist?.().catch(() => false)
  await useWorkout.getState().hydrate()
}
