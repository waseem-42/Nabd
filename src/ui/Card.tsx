import type { HTMLAttributes } from 'react'
import { cx } from './cx'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `home` / `gym` tint the card with the place colour; `accent` for the one hero card. */
  tone?: 'default' | 'raised' | 'home' | 'gym' | 'accent'
  /** Default true: 1.25rem inner padding. */
  padded?: boolean
}

const TONE = {
  default: 'bg-surface border-line',
  raised: 'bg-surface-2 border-line-strong shadow-lift',
  home: 'bg-home-soft border-home/30',
  gym: 'bg-gym-soft border-gym/30',
  accent: 'bg-accent-soft border-accent/30',
}

export function Card({ tone = 'default', padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cx('brand-card rounded-card border', TONE[tone], padded && 'p-5', className)}
      {...rest}
    />
  )
}
