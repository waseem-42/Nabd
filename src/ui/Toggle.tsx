import { cx } from './cx'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name. When the visible label sits next to the switch, pass the same text. */
  label: string
  disabled?: boolean
  className?: string
}

export function Toggle({ checked, onChange, label, disabled, className }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-45',
        checked ? 'border-accent bg-accent' : 'border-line-strong bg-surface-3',
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'absolute top-1 size-6 rounded-full bg-text shadow-lift transition-[inset-inline-start] duration-200 ease-out-back',
          checked ? 'start-[calc(100%-1.75rem)]' : 'start-1',
        )}
      />
    </button>
  )
}
