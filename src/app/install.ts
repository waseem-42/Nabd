import { useSyncExternalStore } from 'react'

/*
 * "Add to home screen". Chrome and Edge on Android fire `beforeinstallprompt` once, early, so
 * it's captured at startup (see main.tsx) and replayed when the user taps Install. iPhone
 * Safari has no prompt: there we show the two taps it takes from the Share menu.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'nabd-install-dismissed'
let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export function captureInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIosSafari = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent)

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstall(): void {
  try {
    localStorage.setItem(DISMISSED_KEY, '1')
  } catch {
    /* private mode: it just shows again next time */
  }
  notify()
}

/** Shows the browser's own install dialog. Resolves true when the user accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  const event = deferred
  deferred = null
  await event.prompt()
  const { outcome } = await event.userChoice
  notify()
  return outcome === 'accepted'
}

export type InstallMode = 'prompt' | 'ios' | null

function snapshot(): InstallMode {
  if (isStandalone() || readDismissed()) return null
  if (deferred) return 'prompt'
  return isIosSafari() ? 'ios' : null
}

/** How the app can be installed here right now: the browser prompt, the iOS steps, or not at all. */
export function useInstall(): InstallMode {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    snapshot,
    () => null,
  )
}
