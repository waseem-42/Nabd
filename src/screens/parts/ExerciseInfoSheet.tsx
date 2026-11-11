import { pick, useLang, useT } from '@/i18n'
import type { Exercise } from '@/types'
import { Badge, Sheet } from '@/ui'
import { ExercisePlayer } from '@/ui/ExercisePlayer'
import { ExerciseSteps } from './ExerciseSteps'
import { ExerciseSafety } from './ExerciseSafety'

export interface ExerciseInfoSheetProps {
  exercise: Exercise | null
  onClose: () => void
}

/** How to do an exercise without leaving the current screen (mid-workout, while editing a routine). */
export function ExerciseInfoSheet({ exercise, onClose }: ExerciseInfoSheetProps) {
  const t = useT()
  const lang = useLang()
  return (
    <Sheet open={!!exercise} onClose={onClose} title={exercise ? pick(exercise.name, lang) : ''}>
      {exercise && (
        <div className="flex flex-col gap-5">
          <ExercisePlayer
            slug={exercise.art}
            name={pick(exercise.name, lang)}
            activity={exercise.id}
          />
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="accent">{t(`common.muscle.${exercise.primary}`)}</Badge>
            {exercise.secondary.map((m) => (
              <Badge key={m}>{t(`common.muscle.${m}`)}</Badge>
            ))}
            <Badge>{t(`common.equipment.${exercise.equipment}`)}</Badge>
          </div>
          <ExerciseSafety exercise={exercise} />
          <ExerciseSteps exercise={exercise} />
        </div>
      )}
    </Sheet>
  )
}
