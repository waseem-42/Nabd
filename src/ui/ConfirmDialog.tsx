import { useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/i18n'
import { Button } from './Button'
import { useModal } from './useModal'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  /** Defaults to common.confirm. */
  confirmLabel?: string
  /** Defaults to common.cancel. */
  cancelLabel?: string
  /** 'danger' paints the confirm button red (deleting, discarding a workout). */
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const t = useT()
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const bodyId = useId()
  useModal(open, onCancel, panel)
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div aria-hidden onClick={onCancel} className="absolute inset-0 animate-fade-in bg-scrim" />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={message ? bodyId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-sm animate-pop-in rounded-card border border-line-strong bg-surface-2 p-6 shadow-lift outline-none"
      >
        <h2 id={titleId} className="text-xl font-bold text-text">
          {title}
        </h2>
        {message && (
          <p id={bodyId} className="mt-2 text-base text-muted">
            {message}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            data-autofocus
            variant={tone === 'danger' ? 'danger' : 'primary'}
            size="md"
            fullWidth
            onClick={onConfirm}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
