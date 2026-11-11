import { useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/routes'
import { unlockAudio } from '@/app/feedback'
import { useWorkout, type StartOptions } from '@/store/session'
import { usePreparationCheck } from '@/app/SafetyProvider'

/** Starts a session and opens the workout screen; resumes the running one instead of starting twice. */
export function useStartWorkout(): (opts?: StartOptions) => Promise<void> {
  const navigate = useNavigate()
  const prepare = usePreparationCheck()
  const starting = useRef(false)
  return useCallback(
    async (opts?: StartOptions) => {
      unlockAudio()
      if (starting.current) return
      starting.current = true
      try {
        if (!useWorkout.getState().session) {
          if (!await prepare()) return
          // The user may have opened another start flow while the sheet was visible.
          if (!useWorkout.getState().session) await useWorkout.getState().start(opts)
        }
        navigate(routes.workout)
      } finally {
        starting.current = false
      }
    },
    [navigate, prepare],
  )
}
