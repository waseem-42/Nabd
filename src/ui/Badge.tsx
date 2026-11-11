import type { ReactNode } from 'react'
import { cx } from './cx'

export type BadgeTone = 'neutral' | 'accent' | 'home' | 'gym' | 'ok' | 'warn'

export interface BadgeProps {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted',
  accent: 'bg-accent-soft text-accent',
  home: 'bg-home-soft text-home',
  gym: 'bg-gym-soft text-gym',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap',
        TONE[tone],
        className,
      )}
    >
      {icon && <span className="inline-flex" aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
