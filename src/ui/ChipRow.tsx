import type { ReactNode } from 'react'
import { Chip } from './Chip'
import { cx } from './cx'

export interface ChipOption<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export interface ChipRowProps<T extends string> {
  options: ReadonlyArray<ChipOption<T>>
  value: T
  onChange: (value: T) => void
  /** Accessible name of the filter group. */
  label: string
  className?: string
}

/** Horizontally scrollable single-select chips. Bleeds to the screen edges inside a px-5 parent. */
export function ChipRow<T extends string>({ options, value, onChange, label, className }: ChipRowProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'no-scrollbar -mx-5 flex snap-x gap-2 overflow-x-auto px-5 py-1 scroll-ps-5',
        className,
      )}
    >
      {options.map((o) => (
        <Chip key={o.value} selected={o.value === value} icon={o.icon} onClick={() => onChange(o.value)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}
