import type { ReactNode } from 'react'
import { cx } from './cx'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface SegmentedProps<T extends string> {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Accessible name of the group. */
  label: string
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedProps<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value))
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('relative flex rounded-control border border-line bg-surface p-1', className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-[0.6rem] bg-surface-3 transition-[inset-inline-start] duration-250 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          insetInlineStart: `calc(0.25rem + (100% - 0.5rem) / ${options.length} * ${index})`,
        }}
      />
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'relative z-10 flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[0.6rem] px-3 text-base font-semibold transition-colors',
              active ? 'text-text' : 'text-muted',
            )}
          >
            {o.icon && <span className="inline-flex" aria-hidden>{o.icon}</span>}
            <span className="truncate">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
