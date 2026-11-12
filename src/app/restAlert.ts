import { translate } from '@/i18n'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'

/*
 * Tells the service worker (public/rest-alert.js) when the current rest ends, so it can notify
 * while the app is in the background. Only when the user turned the alert on and the browser
 * granted notifications; otherwise nothing is sent.
 */

export const notificationsSupported = () => typeof Notification !== 'undefined' && 'serviceWorker' in navigator

/** Asks for permission; resolves true when notifications may be shown. */
export async function enableRestAlert(): Promise<boolean> {
  if (!notificationsSupported()) return false
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission
  return permission === 'granted'
}

function post(endsAt: number | null): void {
  if (!notificationsSupported()) return
  const { lang, restAlert } = useSettings.getState()
  const allowed = restAlert && Notification.permission === 'granted'
  void navigator.serviceWorker.ready.then((registration) =>
    registration.active?.postMessage({
      type: 'nabd-rest',
      endsAt: allowed ? endsAt : null,
      title: translate(lang, 'app.restAlert.title'),
      body: translate(lang, 'app.restAlert.body'),
    }),
  )
}

/** Call once on boot. */
export function startRestAlerts(): void {
  let last = useWorkout.getState().rest?.endsAt ?? null
  if (last) post(last)
  useWorkout.subscribe((state) => {
    const endsAt = state.rest?.endsAt ?? null
    if (endsAt === last) return
    last = endsAt
    post(endsAt)
  })
}
