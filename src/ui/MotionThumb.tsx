import { useEffect, useRef } from 'react'
import { useLang } from '@/i18n'
import { findRig, RIG_DURATION } from '@/motion/engine'
import { createRigRenderer } from '@/motion/svgRenderer'
import { ExerciseArt, usePrefersReducedMotion } from './ExerciseArt'
import { cx } from './cx'

/**
 * One clock for every thumbnail on screen: a single requestAnimationFrame loop at ~20 fps
 * calls each visible figure's draw function directly, without React re-renders.
 */
type Draw = (time: number) => void
const subscribers = new Set<Draw>()
let frame = 0
let last = 0
function loop(now: number) {
  if (now - last >= 50 && !document.hidden) {
    last = now
    const time = (now / 1000) % RIG_DURATION
    for (const draw of subscribers) draw(time)
  }
  frame = subscribers.size ? requestAnimationFrame(loop) : 0
}
function subscribe(draw: Draw): () => void {
  subscribers.add(draw)
  if (!frame && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(loop)
  return () => {
    subscribers.delete(draw)
  }
}

export interface MotionThumbProps {
  exerciseId: string
  name: string
  className?: string
  /** Hold still at the end of the movement instead of looping. */
  still?: boolean
  /** Fallback art slug when the exercise has no rig. */
  art?: string | null
}

/** A looping coloured-parts figure for lists and cards; plays only while on screen. */
export function MotionThumb({ exerciseId, name, className, still, art }: MotionThumbProps) {
  const rig = findRig(exerciseId)
  const lang = useLang()
  const reduced = usePrefersReducedMotion()
  const svg = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const node = svg.current
    if (!rig || !node) return
    const renderer = createRigRenderer(node, rig)
    renderer.render(2.8, lang)
    if (still || reduced) return
    let unsubscribe: (() => void) | null = null
    const start = () => { unsubscribe ??= subscribe((time) => renderer.render(time, lang)) }
    const stop = () => { unsubscribe?.(); unsubscribe = null }
    if (typeof IntersectionObserver === 'undefined') { start(); return stop }
    const observer = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()), { rootMargin: '80px' })
    observer.observe(node)
    return () => { observer.disconnect(); stop() }
  }, [rig, lang, still, reduced])

  if (!rig) return <ExerciseArt slug={art ?? null} still name={name} className={className} />
  return (
    <div className={cx('relative shrink-0 overflow-hidden bg-surface', className)}>
      <svg ref={svg} viewBox="0 0 900 900" role="img" aria-label={name} data-motion-thumb={exerciseId} className="block size-full" />
    </div>
  )
}
