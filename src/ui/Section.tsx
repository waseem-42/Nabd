import type { ReactNode } from 'react'
import { useId } from 'react'
import { cx } from './cx'

export interface SectionProps {
  title?: string
  /** Trailing element on the title line (a small button or count). */
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, action, children, className }: SectionProps) {
  const id = useId()
  return (
    <section aria-labelledby={title ? id : undefined} className={cx('px-5 py-3', className)}>
      {(title || action) && (
        <div className="mb-3 flex min-h-8 items-center justify-between gap-3">
          {title && (
            <h2 id={id} className="flex items-center gap-2 text-sm font-semibold text-text before:h-3 before:w-0.5 before:rounded-full before:bg-accent/70">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
