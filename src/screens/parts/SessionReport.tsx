import { Clock, Dumbbell, Layers, Trophy, Weight } from 'lucide-react'
import { sessionDurationSec, sessionVolume, workSets } from '@/domain/progress'
import { useT } from '@/i18n'
import { fmtClock, kgToUnit } from '@/i18n/format'
import type { WorkoutSession } from '@/types'
import { Badge, Card, cx, Section, StatTile } from '@/ui'
import { useFormat } from './useFormat'

/** Stats, records and every logged set of a finished session (Summary and SessionDetail). */
export function SessionReport({ session, onExercise }: { session: WorkoutSession; onExercise?: (id: string) => void }) {
  const t = useT()
  const fmt = useFormat()
  const volume = sessionVolume(session)
  const sets = session.entries.reduce((n, e) => n + workSets(e).length, 0)
  const prs = new Set(session.prs ?? [])

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-5 py-3">
        <StatTile value={fmtClock(sessionDurationSec(session))} label={t('progress.duration')} icon={<Clock className="size-4" />} />
        <StatTile value={fmt.number(sets)} label={t('progress.sets')} icon={<Layers className="size-4" />} />
        <StatTile value={fmt.number(session.entries.length)} label={t('progress.exercises')} icon={<Dumbbell className="size-4" />} />
        <StatTile
          value={fmt.number(kgToUnit(volume, fmt.unit))}
          unit={fmt.unitLabel}
          label={t('progress.volume')}
          icon={<Weight className="size-4" />}
        />
      </div>

      {prs.size > 0 && (
        <Section>
          <Card tone="accent">
            <p className="flex items-center gap-2 text-lg font-bold text-accent">
              <Trophy className="size-5" aria-hidden />
              {t('progress.newRecords', { n: prs.size })}
            </p>
            <ul className="mt-2 m-0 list-none p-0">
              {[...prs].map((id) => (
                <li key={id} className="truncate text-base text-text">
                  {fmt.exerciseName(id)}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}

      <Section title={t('progress.exercises')}>
        <div className="flex flex-col gap-3">
          {session.entries.map((entry, i) => {
            const mode = fmt.modeOf(entry.exerciseId)
            const head = (
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-start text-lg font-semibold text-text">
                  {fmt.exerciseName(entry.exerciseId)}
                </span>
                {prs.has(entry.exerciseId) && (
                  <Badge tone="accent" icon={<Trophy className="size-3.5" />}>
                    {t('progress.pr')}
                  </Badge>
                )}
              </span>
            )
            return (
              <Card key={i}>
                {onExercise ? (
                  <button type="button" className="block w-full" onClick={() => onExercise(entry.exerciseId)}>
                    {head}
                  </button>
                ) : (
                  head
                )}
                <ol className="mt-3 m-0 flex list-none flex-col gap-1.5 p-0">
                  {entry.sets.map((s, j) => (
                    <li key={j} className="flex items-center gap-3 text-base">
                      <span
                        className={cx(
                          'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums',
                          s.kind === 'warmup' ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted',
                        )}
                      >
                        {s.kind === 'warmup' ? t('common.warmupShort') : j + 1}
                      </span>
                      <span className="font-medium text-text tabular-nums" dir="auto">
                        {fmt.set(s, mode)}
                      </span>
                    </li>
                  ))}
                </ol>
                {entry.note && <p className="mt-3 text-sm text-muted">{entry.note}</p>}
              </Card>
            )
          })}
        </div>
      </Section>
    </>
  )
}
