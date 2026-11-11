import { useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { poseSequence } from '@/domain/exerciseVisuals'
import { useT } from '@/i18n'
import type { ArtFile } from '@/types'
import { findRig } from '@/motion/engine'
import { RigPlayer } from './RigPlayer'
import { ExerciseArt, useArt, usePrefersReducedMotion } from './ExerciseArt'
import { cx } from './cx'

/** Shows real source poses, with explicit steps instead of overlapping silhouettes. */
interface ExercisePlayerProps { slug:string|null;name:string;activity?:string;data?:ArtFile }
export function ExercisePlayer(props:ExercisePlayerProps) {
  const rig=!props.data?findRig(props.activity):undefined
  return rig?<RigPlayer key={rig.id} definition={rig} name={props.name}/>:<SourcePosePlayer {...props}/>
}

function SourcePosePlayer({ slug, name, activity, data }: ExercisePlayerProps) {
  const t = useT()
  const { art, loading } = useArt(slug, data)
  const reduced = usePrefersReducedMotion()
  const [paused, setPaused] = useState(reduced)
  const [speed, setSpeed] = useState(1)
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(true)
  const root = useRef<HTMLDivElement>(null)
  const count = art?.frames.length ?? 0
  const sequence = poseSequence(count)
  const selected = sequence[step % sequence.length] ?? 0

  useEffect(() => { if (reduced) setPaused(true) }, [reduced])
  useEffect(() => { setStep(0) }, [slug])
  useEffect(() => {
    if (!root.current || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting))
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (paused || !visible || count < 2) return
    const timer = window.setInterval(() => { if (!document.hidden) setStep(value => value + 1) }, 1100 / speed)
    return () => window.clearInterval(timer)
  }, [paused, visible, count, speed])

  return <div ref={root} className="overflow-hidden rounded-card border border-line bg-surface">
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3"><span className="text-xs font-medium text-muted">{t('motion.player')}</span><span className="inline-flex items-center gap-1.5 text-xs text-accent"><span className="size-1.5 rounded-full bg-accent" aria-hidden />{t('motion.technical')}</span></div>
    <ExerciseArt slug={slug} data={art ?? undefined} name={name} activity={activity} frameIndex={selected} className="aspect-[4/3] w-full" />
    {count > 0 ? <div className="border-t border-line px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs text-muted">{t('motion.pose', { n: selected + 1, total: count })}</p><span className="text-[0.65rem] text-faint">{t('motion.sourcePoses')}</span></div>
      <div className="mb-3 flex gap-2" role="group" aria-label={t('motion.poseSelector')}>
        {Array.from({ length: count }, (_, frame) => <button key={frame} type="button" aria-label={t('motion.poseLabel', { n: frame + 1 })} aria-pressed={selected === frame} onClick={() => { setPaused(true); setStep(sequence.indexOf(frame)) }} className={cx('flex min-h-11 flex-1 items-center justify-center rounded-control border text-sm font-semibold tabular-nums', selected === frame ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line bg-bg text-muted')}>{frame + 1}</button>)}
      </div>
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1"><button type="button" disabled={count < 2} onClick={() => setPaused(value => !value)} aria-label={t(paused ? 'motion.play' : 'motion.pause')} aria-pressed={!paused} className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-ink disabled:opacity-40">{paused ? <Play className="size-4" /> : <Pause className="size-4" />}</button><button type="button" onClick={() => { setPaused(true); setStep(0) }} aria-label={t('motion.restart')} className="flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-2"><RotateCcw className="size-4" /></button></div><div className="flex gap-1 rounded-pill bg-bg p-1" role="group" aria-label={t('motion.speed')}>{[.5,1].map(value => <button key={value} type="button" aria-pressed={speed===value} onClick={() => setSpeed(value)} className={cx('min-h-10 min-w-11 rounded-pill px-3 text-xs',speed===value?'bg-surface-3 text-text':'text-muted')} dir="ltr">{value}×</button>)}</div></div>
    </div> : !loading && <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-muted">{t('motion.symbolOnly')}</p>}
  </div>
}
