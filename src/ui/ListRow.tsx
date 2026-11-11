import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cx } from './cx'

export interface ListRowProps {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
  /** Forward chevron (flips in RTL). */
  chevron?: boolean
  /** Makes the whole row a button. */
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  chevron,
  onClick,
  disabled,
  className,
}: ListRowProps) {
  const body = (
    <>
      {leading && <span className="flex shrink-0 items-center">{leading}</span>}
      <span className="min-w-0 flex-1 text-start">
        <span className="block truncate text-base font-medium text-text">{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center text-muted">{trailing}</span>}
      {chevron && (
        <ChevronRight className="size-5 shrink-0 text-faint rtl:-scale-x-100" aria-hidden />
      )}
    </>
  )
  const base = 'flex min-h-16 w-full items-center gap-3 px-4 py-3'
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cx(
          base,
          'rounded-card transition-colors enabled:active:bg-surface-2 disabled:opacity-45',
          className,
        )}
      >
        {body}
      </button>
    )
  }
  return <div className={cx(base, className)}>{body}</div>
}
