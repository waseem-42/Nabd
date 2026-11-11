import { useMemo } from 'react'
import { muscleReadiness } from '@/domain/recovery'
import { useT } from '@/i18n'
import type { ExerciseLookup, WorkoutSession } from '@/types'
import { Card, cx, MuscleGroupIcon, Section } from '@/ui'

/** Fitbod-style readiness at a glance: which groups are rested and which are still recovering. */
export function ReadinessCard({ sessions, lookup, now }: { sessions: WorkoutSession[]; lookup: ExerciseLookup; now: number }) {
  const t = useT()
  // Recompute at most every hour: readiness moves slowly.
  const hour = Math.ceil(now / 3_600_000)
  const list = useMemo(() => muscleReadiness(sessions, lookup, hour * 3_600_000), [sessions, lookup, hour])
  if (!list.some((r) => r.hoursSince !== null)) return null
  return (
    <Section title={t('body.recoveryTitle')}>
    <Card>
      <ul className="m-0 grid list-none grid-cols-3 gap-x-2 gap-y-4 p-0">
        {list.map((r) => {
          const fresh = r.value >= 0.95
          return (
            <li key={r.group} className="flex flex-col items-center gap-1.5 text-center">
              <span className="relative flex size-14 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="16" fill="none" stroke="var(--color-line)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
                    stroke={fresh ? 'var(--color-ok)' : 'var(--color-warn)'}
                    strokeDasharray={`${Math.max(0.02, r.value) * 100.5} 100.5`}
                  />
                </svg>
                <MuscleGroupIcon group={r.group} className="h-8 text-muted" />
              </span>
              <span className="text-sm font-medium text-text">{t(`common.group.${r.group}`)}</span>
              <span className={cx('text-xs tabular-nums', fresh ? 'text-ok' : 'text-warn')}>
                {fresh ? t('body.fresh') : <>{t('body.recovering')} <span dir="ltr">{Math.round(r.value * 100)}%</span></>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-faint">{t('body.recoveryHint')}</p>
    </Card>
    </Section>
  )
}
