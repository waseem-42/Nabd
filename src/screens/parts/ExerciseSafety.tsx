import { ShieldCheck } from 'lucide-react'
import { safetyFor, SAFETY_SOURCES } from '@/domain/safety'
import { pick, useLang, useT } from '@/i18n'
import { findRig } from '@/motion/engine'
import type { Exercise } from '@/types'
import { Card } from '@/ui/Card'

export function SafetySources({ exercise }: { exercise?: Exercise }) {
  const t = useT()
  const sources = exercise && !exercise.custom ? findRig(exercise.id)?.sources ?? [] : []
  return <details className="text-xs leading-relaxed text-muted">
    <summary className="min-h-11 cursor-pointer py-3 font-medium underline underline-offset-4">{t('safety.sources')}</summary>
    <p className="mb-2">{t('safety.limit')}</p>
    <div className="flex flex-wrap gap-x-4 gap-y-2 pb-2" dir="ltr">
      <a className="underline" href={SAFETY_SOURCES.technique} target="_blank" rel="noreferrer">Mayo Clinic</a>
      <a className="underline" href={SAFETY_SOURCES.symptoms} target="_blank" rel="noreferrer">NHS</a>
      <a className="underline" href={SAFETY_SOURCES.activity} target="_blank" rel="noreferrer">NIDDK</a>
      {exercise?.kind === 'stretch' && <a className="underline" href={SAFETY_SOURCES.stretch} target="_blank" rel="noreferrer">AHA</a>}
      {sources.map((url, i) => <a className="underline" href={url} key={url} target="_blank" rel="noreferrer">ACE {i + 1}</a>)}
    </div>
  </details>
}

export function ExerciseSafety({ exercise }: { exercise: Exercise }) {
  const t = useT(), lang = useLang()
  const { specific, cues } = safetyFor(exercise)
  return <Card className="border-accent/25" data-exercise-safety={exercise.id}>
    <h2 className="flex items-center gap-2 text-base font-bold"><ShieldCheck className="size-5 text-accent" aria-hidden />{t('safety.title')}</h2>
    {!specific && <p className="mt-1 text-xs text-muted">{t('safety.general')}</p>}
    <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed">{cues.map(cue => <li key={cue.en}>{pick(cue, lang)}</li>)}</ul>
    <p className="mt-3 border-t border-line pt-3 text-sm font-medium leading-relaxed text-warn">{t('safety.stopCue')}</p>
    <p className="mt-2 text-xs leading-relaxed text-muted">{t('safety.limit')}</p>
    <SafetySources exercise={exercise} />
  </Card>
}
