import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { routes } from '@/app/routes'
import { useAllExercises, useDoneSessions } from '@/db'
import { exerciseHistory, metricOf, personalRecords } from '@/domain/progress'
import { exerciseStepsFor, safetyFor } from '@/domain/safety'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, fmtDate, kgToUnit } from '@/i18n/format'
import type { Exercise as ExerciseT } from '@/types'
import { Card, EmptyState, LineChart, ListRow, Screen, StatTile, cx } from '@/ui'
import { ExercisePlayer } from '@/ui/ExercisePlayer'
import { SafetySources } from './parts/ExerciseSafety'
import { useFormat } from './parts/useFormat'

/** One exercise: the movement first, short steps under it, safety one tap away. */
export default function Exercise() {
  const { id = '' } = useParams()
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const { byId } = useAllExercises()
  const exercise = byId(decodeURIComponent(id))
  const [safetyOpen, setSafetyOpen] = useState(false)

  if (!exercise) {
    return <Screen title={t('common.unknownExercise')} onBack={() => navigate(-1)}><EmptyState title={t('common.unknownExercise')} /></Screen>
  }
  const name = fmt.exerciseName(exercise.id)
  const steps = exerciseStepsFor(exercise, lang)
  const { cues } = safetyFor(exercise)

  return (
    <Screen title={name} onBack={() => navigate(-1)}>
      <div className="flex flex-col gap-4 px-5 pb-10">
        <ExercisePlayer slug={exercise.art} name={name} activity={exercise.id} />

        <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
          <span className="font-semibold text-accent">{t(`common.muscle.${exercise.primary}`)}</span>
          {exercise.secondary.slice(0, 2).map((m) => <span key={m}>{t(`common.muscle.${m}`)}</span>)}
          <span>· {t(`common.equipment.${exercise.equipment}`)}</span>
        </p>

        {steps.length > 0 && (
          <section aria-labelledby="how">
            <h2 id="how" className="mb-3 text-lg font-bold">{t('app.how')}</h2>
            <ol className="m-0 flex list-none flex-col gap-3 p-0">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold tabular-nums text-accent">{fmt.number(i + 1)}</span>
                  <p className="m-0 pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <ExerciseHistory exercise={exercise} />

        <section className="rounded-card border border-line bg-surface" data-exercise-safety={exercise.id}>
          <button type="button" aria-expanded={safetyOpen} onClick={() => setSafetyOpen((v) => !v)} className="flex min-h-14 w-full items-center gap-2 px-4 text-start font-bold">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            <span className="flex-1">{t('app.safety')}</span>
            <ChevronDown className={cx('size-5 text-muted transition-transform', safetyOpen && 'rotate-180')} aria-hidden />
          </button>
          {safetyOpen && (
            <div className="px-4 pb-4">
              <ul className="m-0 list-disc space-y-2 ps-5 text-sm leading-relaxed">{cues.map((cue) => <li key={cue.en}>{pick(cue, lang)}</li>)}</ul>
              <p className="mt-3 text-sm font-medium text-warn">{t('safety.stopCue')}</p>
              <SafetySources exercise={exercise} />
            </div>
          )}
        </section>
      </div>
    </Screen>
  )
}

/** Best result, a chart of every session and the last few times — the proof of progress. */
function ExerciseHistory({ exercise }: { exercise: ExerciseT }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const navigate = useNavigate()
  const sessions = useDoneSessions()
  const metric = metricOf(exercise)
  const points = useMemo(() => (sessions ? exerciseHistory(sessions, exercise) : []), [sessions, exercise])
  const records = useMemo(() => (sessions ? personalRecords(sessions, exercise.id) : null), [sessions, exercise.id])
  if (!sessions) return null

  const show = (value: number) =>
    metric === 'sec' ? fmtClock(value) : metric === 'reps' ? fmt.number(value) : fmt.number(Math.round(kgToUnit(value, fmt.unit) * 10) / 10, 1)
  const best = records ? (metric === 'sec' ? records.sec : metric === 'reps' ? records.reps : records.weight) : 0
  const bestUnit = metric === 'weight' ? fmt.unitLabel : metric === 'reps' ? t('common.reps') : undefined

  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title" className="mb-3 text-lg font-bold">{t('app.ex.history')}</h2>
      {!points.length ? (
        <p className="rounded-card border border-dashed border-line p-5 text-center text-sm text-muted">{t('app.ex.never')}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <StatTile value={show(best)} unit={bestUnit} label={t('app.ex.best')} tone="accent" />
            <StatTile value={fmt.number(points.length)} label={t('app.ex.times')} />
          </div>
          <Card>
            <p className="mb-2 text-sm text-muted">{t(`app.ex.chart.${metric}`)}</p>
            <LineChart
              points={points.slice(-12).map((p) => ({ label: fmtDate(p.startedAt, lang), value: metric === 'weight' ? Math.round(kgToUnit(p.value, fmt.unit) * 10) / 10 : p.value }))}
              formatValue={(n) => (metric === 'sec' ? fmtClock(n) : fmt.number(n, metric === 'weight' ? 1 : 0))}
              label={t(`app.ex.chart.${metric}`)}
              height={150}
            />
          </Card>
          <Card padded={false} className="py-1">
            {[...points].reverse().slice(0, 3).map((p) => {
              const session = sessions.find((s) => s.id === p.sessionId)
              const sets = session?.entries.filter((e) => e.exerciseId === exercise.id).flatMap((e) => e.sets.filter((s) => s.done && s.kind === 'normal')) ?? []
              return (
                <ListRow
                  key={p.sessionId}
                  title={fmt.setList(sets, exercise.mode)}
                  subtitle={fmtDate(p.startedAt, lang)}
                  chevron
                  onClick={() => navigate(routes.session(p.sessionId))}
                />
              )
            })}
          </Card>
        </div>
      )}
    </section>
  )
}
