import { useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useT } from '@/i18n'
import { cx } from './cx'
import { IconButton } from './IconButton'
import { useModal } from './useModal'

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Sticky area under the scrolling body (usually a primary Button). */
  footer?: ReactNode
  /** Make the sheet fill ~90% of the height even when content is short (pickers). */
  tall?: boolean
}

/** Bottom sheet: backdrop tap / Escape / ✕ close it; focus is trapped; the page cannot scroll. */
export function Sheet({ open, onClose, title, children, footer, tall }: SheetProps) {
  const t = useT()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useModal(open, onClose, panel)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-scrim"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'relative flex w-full max-w-md animate-sheet-in flex-col overflow-hidden rounded-t-sheet border border-b-0 border-line bg-surface shadow-lift outline-none',
          tall ? 'h-[90dvh]' : 'max-h-[90dvh]',
        )}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" aria-hidden />
        <div className="flex shrink-0 items-center justify-between gap-3 ps-5 pe-2 pt-1 pb-2">
          <h2 id={titleId} className="text-xl font-bold text-text">
            {title}
          </h2>
          <IconButton label={t('common.close')} icon={<X className="size-6" />} onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-line px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
        {!footer && <div className="shrink-0 pb-safe" />}
      </div>
    </div>,
    document.body,
  )
}
