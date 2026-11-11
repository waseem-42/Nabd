import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

let lockCount = 0

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Shared overlay behaviour: body scroll lock, Escape to close, focus moved into the panel and
 * trapped there, focus restored to the opener on close.
 */
export function useModal(open: boolean, onClose: () => void, panel: RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    lockCount += 1
    if (lockCount === 1) document.body.style.overflow = 'hidden'

    const el = panel.current
    // Prefer the first real control; fall back to the panel itself.
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? null
    ;(first ?? el)?.focus({ preventScroll: true })

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key !== 'Tab' || !el) return
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const firstItem = items[0]!
      const lastItem = items[items.length - 1]!
      if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === el)) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      lockCount -= 1
      if (lockCount === 0) document.body.style.overflow = ''
      opener?.focus?.({ preventScroll: true })
    }
  }, [open, panel])
}
