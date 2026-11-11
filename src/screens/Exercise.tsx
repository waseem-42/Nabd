import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ShieldCheck } from 'lucide-react'
import { useAllExercises } from '@/db'
import { exerciseStepsFor, safetyFor } from '@/domain/safety'
import { pick, useLang, useT } from '@/i18n'
import { EmptyState, Screen, cx } from '@/ui'
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
