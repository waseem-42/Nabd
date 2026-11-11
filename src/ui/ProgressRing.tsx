import type { ReactNode } from 'react'
import { cx } from './cx'

export interface ProgressRingProps {
  /** 0..1 — the part of the ring still lit. For the rest timer pass remaining/total. */
  progress: number
  /** Diameter in px. Default 240. */
  size?: number
  /** Stroke width in px. Default 14. */
  stroke?: number
  tone?: 'accent' | 'ok' | 'home' | 'gym'
  /** Centre content (the countdown). */
  children?: ReactNode
  /** Accessible name; the ring is exposed as a progressbar. */
  label: string
  className?: string
}

const STROKE = {
  accent: 'stroke-accent',
  ok: 'stroke-ok',
  home: 'stroke-home',
  gym: 'stroke-gym',
}

/** Circular countdown. Never mirrored in RTL: it sweeps clockwise like a clock. */
export function ProgressRing({
  progress,
  size = 240,
  stroke = 14,
  tone = 'accent',
  children,
  label,
  className,
}: ProgressRingProps) {
  const p = Math.min(1, Math.max(0, progress))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div
      dir="ltr"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p * 100)}
      className={cx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-surface-2" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className={cx(STROKE[tone], 'transition-[stroke-dashoffset] duration-1000 ease-linear')}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
