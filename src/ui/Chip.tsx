import type { ReactNode } from 'react'
import { cx } from './cx'

export interface ChipProps {
  selected?: boolean
  onClick?: () => void
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Chip({ selected, onClick, icon, children, className }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={!!selected}
      onClick={onClick}
      className={cx(
        'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-full border px-4 text-base font-medium whitespace-nowrap transition-colors',
        selected
          ? 'border-text bg-text text-bg'
          : 'border-line bg-surface text-muted enabled:active:bg-surface-2',
        className,
      )}
    >
      {icon && <span className="inline-flex" aria-hidden>{icon}</span>}
      {children}
    </button>
  )
}
