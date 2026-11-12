import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/routes'
import { unlockAudio } from '@/app/feedback'
import { useWorkout, type StartOptions } from '@/store/session'

/** Starts a session and opens the workout screen; resumes the running one instead of starting twice. */
export function useStartWorkout(): (opts?: StartOptions) => Promise<void> {
  const navigate = useNavigate()
  const starting = useRef(false)
  return useCallback(
    async (opts?: StartOptions) => {
      unlockAudio()
      if (starting.current) return
      starting.current = true
      try {
        // No checklist gate: the workout opens on its warm-up, which is the first step.
        if (!useWorkout.getState().session) await useWorkout.getState().start(opts)
        navigate(routes.workout)
      } finally {
        starting.current = false
      }
    },
    [navigate],
  )
}
