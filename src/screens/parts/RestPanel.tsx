import { useEffect } from 'react'
import { beep, vibrate } from '@/app/feedback'
import { useNow } from '@/app/useNow'
import { useT } from '@/i18n'
import { fmtClock } from '@/i18n/format'
import { restRemainingSec, useWorkout, type RestTimer } from '@/store/session'
import { useSettings } from '@/store/settings'
import { Button, ProgressRing } from '@/ui'

/** The running rest countdown: ring, time left, ±15 s and skip. Cues and clears itself at zero. */
export function RestPanel({ rest }: { rest: RestTimer }) {
  const t = useT()
  const sound = useSettings((s) => s.sound)
  const addRest = useWorkout((s) => s.addRest)
  const skipRest = useWorkout((s) => s.skipRest)
  const now = useNow(250)
  const left = restRemainingSec(rest, now)

  useEffect(() => {
    if (left > 0) return
    if (sound) beep()
    vibrate([180, 90, 180])
    skipRest()
  }, [left, sound, skipRest])

  return (
    <div className="mb-3 rounded-card border border-line bg-surface p-3">
      <div className="flex items-center gap-3">
        <ProgressRing progress={left / rest.totalSec} size={56} stroke={6} label={t('workout.rest')} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{t('workout.rest')}</p>
          <p className="text-3xl font-bold text-text tabular-nums">{fmtClock(left)}</p>
        </div>
        <Button variant="ghost" className="shrink-0 px-4" onClick={skipRest}>
          {t('workout.skip')}
        </Button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2" dir="ltr">
        <Button variant="secondary" onClick={() => addRest(-15)} aria-label={t('workout.restLess')}>
          −15
        </Button>
        <Button variant="secondary" onClick={() => addRest(15)} aria-label={t('workout.restMore')}>
          +15
        </Button>
      </div>
    </div>
  )
}
