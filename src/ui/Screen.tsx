import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useT } from '@/i18n'
import { cx } from './cx'
import { IconButton } from './IconButton'

export interface ScreenProps {
  title: string
  subtitle?: string
  /** Shows a back button (flips in RTL) when provided. */
  onBack?: () => void
  /** Trailing header actions (IconButtons). */
  actions?: ReactNode
  /** Sticky bottom action area; sits above the safe area. Usually one big <Button>. */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function Screen({ title, subtitle, onBack, actions, footer, children, className }: ScreenProps) {
  const t = useT()
  return (
    <div className={cx('flex flex-1 flex-col', className)}>
      <header className="px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-2">
        {onBack && (
          <div className="mb-2 flex min-h-12 items-center justify-between gap-2">
            {onBack ? (
              <IconButton
                label={t('common.back')}
                variant="solid"
                onClick={onBack}
                className="-ms-1"
                icon={<ChevronLeft className="size-6 rtl:-scale-x-100" />}
              />
            ) : (
              <span />
            )}
            {actions && <div className="flex items-center gap-1">{actions}</div>}
          </div>
        )}
        <div className="flex items-center justify-between gap-3"><h1 className="min-w-0 text-title font-bold text-text">{title}</h1>{!onBack && actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}</div>
        {subtitle && <p className="mt-1 text-base text-muted">{subtitle}</p>}
      </header>
      <div className="flex-1 pb-6">{children}</div>
      {footer && (
        <div className="sticky bottom-0 z-20 border-t border-line bg-bg/92 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
          {footer}
        </div>
      )}
    </div>
  )
}
