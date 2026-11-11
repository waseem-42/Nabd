import { useEffect } from 'react'

interface Sentinel { release: () => Promise<void> }
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<Sentinel> } }

/**
 * Keeps the screen on while `active` (during a workout the phone sits on the floor between
 * sets). Browsers drop the lock when the tab is hidden, so it is taken again on return.
 * Silently does nothing where the Wake Lock API is missing or refused (low battery).
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock
    if (!active || !wakeLock) return
    let sentinel: Sentinel | null = null
    let cancelled = false
    const acquire = () => {
      if (document.visibilityState !== 'visible') return
      wakeLock.request('screen').then(
        (lock) => {
          if (cancelled) void lock.release().catch(() => undefined)
          else sentinel = lock
        },
        () => undefined,
      )
    }
    acquire()
    document.addEventListener('visibilitychange', acquire)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', acquire)
      void sentinel?.release().catch(() => undefined)
    }
  }, [active])
}
