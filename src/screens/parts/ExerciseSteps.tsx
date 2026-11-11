import { useLang, useT } from '@/i18n'
import { exerciseStepsFor } from '@/domain/safety'
import type { Exercise } from '@/types'
import { EmptyState } from '@/ui'

/** Numbered how-to steps in the user's language, falling back to English until translated. */
export function ExerciseSteps({ exercise }: { exercise: Exercise }) {
  const t = useT()
  const lang = useLang()
  const steps = exerciseStepsFor(exercise, lang)
  if (!steps.length) return <EmptyState title={t('library.noSteps')} className="py-6" />
  return (
    <ol className="m-0 flex list-none flex-col gap-4 p-0">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-accent/15 bg-accent-soft text-sm font-bold text-accent tabular-nums">
            {i + 1}
          </span>
          <p className="m-0 pt-0.5 text-base text-text">{step}</p>
        </li>
      ))}
    </ol>
  )
}
