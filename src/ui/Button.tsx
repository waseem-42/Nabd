import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Icon shown before the label (on the reading-start side). */
  icon?: ReactNode
  loading?: boolean
  children?: ReactNode
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-glow enabled:active:brightness-90 enabled:hover:brightness-110',
  secondary: 'bg-surface-2 text-text border border-line enabled:active:bg-surface-3',
  ghost: 'bg-transparent text-text enabled:active:bg-surface-2',
  danger: 'bg-danger-soft text-danger border border-danger/30 enabled:active:bg-danger/25',
}

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 text-base gap-2',
  lg: 'min-h-16 px-7 text-xl gap-3',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  icon,
  loading,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex select-none items-center justify-center rounded-control font-semibold transition-[background-color,filter,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden />
      ) : (
        icon && <span className="inline-flex shrink-0" aria-hidden>{icon}</span>
      )}
      {children != null && <span className="min-w-0 truncate">{children}</span>}
    </button>
  )
}
