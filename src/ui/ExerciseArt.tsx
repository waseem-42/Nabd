import { useEffect, useRef, useState } from 'react'
import { EXERCISE_VISUAL_STYLE, poseSequence } from '@/domain/exerciseVisuals'
import type { ArtFile } from '@/types'
import { ActivitySymbol } from './ActivitySymbol'
import { findRig } from '@/motion/engine'
import { RigFigure } from './RigFigure'
import { cx } from './cx'

export interface ExerciseArtProps {
  /** Art slug from `Exercise.art`; null shows the fallback. */
  slug: string | null
  /** Only the first frame (list thumbnails). */
  still?: boolean
  /** Pause at the current pose without resetting the frame. */
  paused?: boolean
  /** External source-pose selection for the reference player. */
  frameIndex?: number
  /** Specific symbol when a sport has no illustrated movement sequence. */
  activity?: string
  /** Inline art, bypassing the network (gallery / tests). */
  data?: ArtFile
  /** Used for the fallback initial. */
  name?: string
  /** Time each frame is held, ms. Default 900. */
  frameMs?: number
  /** Size and shape come from the caller: e.g. "size-14 rounded-xl" or "w-full aspect-square". */
  className?: string
}

type Entry = ArtFile | 'missing'
const cache = new Map<string, Entry>()
const inflight = new Map<string, Promise<Entry>>()

function loadArt(slug: string): Promise<Entry> {
  const hit = cache.get(slug)
  if (hit) return Promise.resolve(hit)
  let p = inflight.get(slug)
  if (!p) {
    p = (async (): Promise<Entry> => {
      try {
        const r = await fetch(`/art/${encodeURIComponent(slug)}.json`)
        if (!r.ok) return 'missing'
        const j = (await r.json()) as ArtFile
        return Array.isArray(j.frames) && j.frames.length > 0 && Array.isArray(j.viewBox) ? j : 'missing'
      } catch {
        return 'missing'
      }
    })().then((entry) => {
      cache.set(slug, entry)
      inflight.delete(slug)
      return entry
    })
    inflight.set(slug, p)
  }
  return p
}

export function useArt(slug: string | null, data?: ArtFile): { art: ArtFile | null; loading: boolean } {
  const [, force] = useState(0)
  useEffect(() => {
    if (!slug || data || cache.has(slug)) return
    let live = true
    void loadArt(slug).then(() => live && force((n) => n + 1))
    return () => {
      live = false
    }
  }, [slug, data])
  if (data) return { art: data, loading: false }
  if (!slug) return { art: null, loading: false }
  const entry = cache.get(slug)
  if (!entry) return { art: null, loading: true }
  return { art: entry === 'missing' ? null : entry, loading: false }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

/** Approved technical treatment of each exercise's own documented source poses. */
export function ExerciseArt({ slug, still, paused, frameIndex, activity, data, name, frameMs = 1100, className }: ExerciseArtProps) {
  const rig=!data?findRig(activity):undefined
  const { art, loading } = useArt(rig?null:slug, data)
  const reduced = usePrefersReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [index, setIndex] = useState(0)

  const frames = art?.frames.length ?? 0
  const animate = frameIndex === undefined && !still && !paused && !reduced && frames > 1

  useEffect(() => {
    const el = box.current
    if (!animate || !el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [animate])

  useEffect(() => {
    if (!animate || !visible) return
    const id = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => i + 1)
    }, frameMs)
    return () => window.clearInterval(id)
  }, [animate, visible, frames, frameMs])

  const shell = cx('technical-art relative shrink-0 overflow-hidden bg-surface text-text', className)

  if(rig)return <div className={shell}><RigFigure definition={rig} time={still?2.8:0} name={name??rig.title.en}/></div>

  if (!art) {
    return (
      <div ref={box} className={cx(shell, 'flex items-center justify-center text-muted')} data-visual-style={EXERCISE_VISUAL_STYLE} role={name ? 'img' : undefined} aria-label={name} aria-hidden={name ? undefined : true}>
        {loading ? (
          <span className="size-1/3 animate-pulse rounded-full bg-line" />
        ) : (
          <ActivitySymbol activity={activity} />
        )}
      </div>
    )
  }

  const [x, y, w, h] = art.viewBox
  const sequence = poseSequence(frames)
  const selected = frameIndex !== undefined ? Math.max(0, Math.min(frames - 1, Math.trunc(frameIndex))) : still || reduced ? 0 : sequence[index % sequence.length] ?? 0
  return (
    <div ref={box} className={shell} data-visual-style={EXERCISE_VISUAL_STYLE} data-pose={selected} role="img" aria-label={name} aria-hidden={name ? undefined : true}>
      <svg
        viewBox={`${x} ${y} ${w} ${h}`}
        className="relative size-full p-[8%]"
        fill="var(--color-technical-fill)"
        stroke="var(--color-technical-line)"
        strokeWidth={Math.max(w,h) * .0012}
        strokeLinejoin="round"
        strokeLinecap="round"
        fillRule="evenodd"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Poses crossfade briefly instead of cutting; stills render only the chosen pose. */}
        {art.frames.map((d, i) => (still || reduced) && i !== selected ? null : (
          <path
            key={i}
            d={d}
            className="pose-frame"
            data-active={i === selected ? '' : undefined}
            style={{ opacity: i === selected ? 1 : 0 }}
          />
        ))}
      </svg>
    </div>
  )
}
