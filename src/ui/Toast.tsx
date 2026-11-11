import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'

export interface ToastOptions {
  tone?: 'default' | 'ok' | 'danger'
  /** Default 2600. */
  durationMs?: number
}

export type ShowToast = (message: string, options?: ToastOptions) => void

interface ToastItem extends ToastOptions {
  id: number
  message: string
}

const ToastContext = createContext<ShowToast>(() => {})

/** `const toast = useToast(); toast('Saved', { tone: 'ok' })`. No-op outside a provider. */
export function useToast(): ShowToast {
  return useContext(ToastContext)
}

/** Mount once near the root. Toasts float above the tab bar and stay out of the way of taps. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((list) => list.filter((i) => i.id !== id))
  }, [])

  const show = useCallback<ShowToast>(
    (message, options) => {
      const id = nextId.current++
      setItems((list) => [...list.slice(-2), { id, message, ...options }])
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), options?.durationMs ?? 2600),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => window.clearTimeout(t))
  }, [])

  const value = useMemo(() => show, [show])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex max-w-md flex-col items-center gap-2 px-5"
        >
          {items.map((i) => (
            <div
              key={i.id}
              className={cx(
                'pointer-events-auto animate-toast-in rounded-full border px-5 py-3 text-base font-medium shadow-lift',
                i.tone === 'ok' && 'border-ok/40 bg-surface-2 text-ok',
                i.tone === 'danger' && 'border-danger/40 bg-surface-2 text-danger',
                (!i.tone || i.tone === 'default') && 'border-line-strong bg-surface-2 text-text',
              )}
            >
              {i.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
