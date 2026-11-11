import { useEffect, useRef } from 'react'
import type { MotionStyle } from '@/store/motionReview'
import { useLang } from '@/i18n'
import { cx } from './cx'

/** Same deterministic composition that Qassa previews and renders. No video download. */
export function MotionFrame({ style, time, className }: { style: MotionStyle; time: number; className?: string }) {
  const lang = useLang()
  const frame = useRef<HTMLIFrameElement>(null)
  const current = useRef({ time, style, lang })
  current.current = { time, style, lang }
  function seek() {
    frame.current?.contentWindow?.postMessage({ type: 'nabd:seek', ...current.current }, window.location.origin)
  }
  useEffect(seek, [time, style, lang])
  return <iframe ref={frame} src={`/motion/squat/index.html?style=${style}&lang=${lang}`} onLoad={seek} title={`Nabd motion: ${style}`} aria-hidden="true" tabIndex={-1} className={cx('pointer-events-none aspect-square w-full border-0', className)} />
}
