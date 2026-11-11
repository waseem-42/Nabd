import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name (required — there is no visible text). */
  label: string
  icon: ReactNode
  variant?: 'ghost' | 'solid' | 'accent'
  size?: 'md' | 'lg'
}

const VARIANT = {
  ghost: 'text-text enabled:active:bg-surface-2',
  solid: 'bg-surface-2 text-text border border-line enabled:active:bg-surface-3',
  accent: 'bg-accent text-accent-ink shadow-glow enabled:active:brightness-90',
}

export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full transition-[background-color,transform] duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45',
        size === 'md' ? 'size-12' : 'size-16',
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      <span className="inline-flex" aria-hidden>
        {icon}
      </span>
    </button>
  )
}
