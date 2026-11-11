import type { InputHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from './cx'

export interface TextFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  error?: string
}

export function TextField({ label, value, onChange, hint, error, className, id, ...rest }: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  const noteId = `${inputId}-note`
  const note = error ?? hint
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-muted">
        {label}
      </label>
      <input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={note ? noteId : undefined}
        className={cx(
          'min-h-14 w-full rounded-control border bg-surface px-4 text-lg text-text placeholder:text-faint',
          'transition-colors focus:border-accent focus:outline-none focus-visible:outline-none',
          error ? 'border-danger' : 'border-line',
        )}
        {...rest}
      />
      {note && (
        <p id={noteId} className={cx('mt-2 text-sm', error ? 'text-danger' : 'text-faint')}>
          {note}
        </p>
      )}
    </div>
  )
}
