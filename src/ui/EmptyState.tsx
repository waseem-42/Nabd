import type { ReactNode } from 'react'
import { cx } from './cx'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  body?: string
  /** Usually a <Button>. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-center px-8 py-12 text-center', className)}>
      {icon && (
        <div
          className="mb-5 flex size-20 items-center justify-center rounded-full border border-line bg-surface text-muted"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="text-lg font-semibold text-text">{title}</p>
      {body && <p className="mt-1.5 max-w-xs text-base text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
