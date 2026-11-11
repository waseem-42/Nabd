import type { ReactNode } from 'react'
import { cx } from './cx'

export interface StatTileProps {
  /** Already formatted (use fmtNumber / fmtWeight). */
  value: string | number
  label: string
  /** Small suffix next to the number ("kg"). */
  unit?: string
  icon?: ReactNode
  tone?: 'default' | 'accent' | 'home' | 'gym' | 'ok'
  className?: string
}

const VALUE_TONE = {
  default: 'text-text',
  accent: 'text-accent',
  home: 'text-home',
  gym: 'text-gym',
  ok: 'text-ok',
}

export function StatTile({ value, label, unit, icon, tone = 'default', className }: StatTileProps) {
  return (
    <div className={cx('flex min-w-0 flex-col rounded-card border border-line bg-surface p-4', className)}>
      <div className="flex items-baseline gap-1.5" dir="ltr">
        <span className={cx('text-num font-bold tabular-nums', VALUE_TONE[tone])}>{value}</span>
        {unit && <span className="text-base font-medium text-muted">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted">
        {icon && <span className="inline-flex" aria-hidden>{icon}</span>}
        <span className="truncate">{label}</span>
      </div>
    </div>
  )
}
