import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { pick, useLang, useT } from '@/i18n'
import type { ArtFile, Exercise } from '@/types'
import { Badge } from './Badge'
import { cx } from './cx'
import { ExerciseArt } from './ExerciseArt'

export interface ExerciseRowProps {
  exercise: Exercise
  /** Makes the row a button. */
  onClick?: () => void
  /** Replaces the default forward chevron (a "+" button, a set count…). */
  trailing?: ReactNode
  /** Small extra line under the tags ("Last time: 60 kg × 8"). */
  note?: string
  /** Inline art override (gallery / tests). */
  artData?: ArtFile
  className?: string
}

export function ExerciseRow({ exercise, onClick, trailing, note, artData, className }: ExerciseRowProps) {
  const t = useT()
  const lang = useLang()
  const name = pick(exercise.name, lang)
  const body = (
    <>
      <ExerciseArt
        slug={exercise.art}
        still
        data={artData}
        name={name}
        activity={exercise.id}
        className="size-18 rounded-control border border-line/50 bg-bg/50"
      />
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-base font-semibold text-text">{name}</span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge tone="accent">{t(`common.muscle.${exercise.primary}`)}</Badge>
          <span className="inline-flex items-center text-xs text-muted">{t(`common.equipment.${exercise.equipment}`)}</span>
        </span>
        {note && <span className="mt-1 block truncate text-xs text-faint">{note}</span>}
      </span>
      {trailing ?? (onClick && <ChevronRight className="size-5 shrink-0 text-faint rtl:-scale-x-100" aria-hidden />)}
    </>
  )
  const base = 'flex min-h-20 w-full items-center gap-3 px-4 py-2'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cx(base, 'rounded-card transition-colors active:bg-surface-2', className)}
      >
        {body}
      </button>
    )
  }
  return <div className={cx(base, className)}>{body}</div>
}
