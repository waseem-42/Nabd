/*
 * Rest-over alert while the app is in the background. Loaded into the generated service worker
 * through workbox `importScripts` (vite.config.ts). The page posts the end time of each rest;
 * the worker waits it out and shows a notification unless the app is on screen by then (the
 * page plays its own sound there). A newer message cancels an older wait.
 */
let restToken = 0

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'nabd-rest') return
  const token = ++restToken
  if (!data.endsAt) return // rest skipped or finished in the app
  const wait = Math.max(0, data.endsAt - Date.now())
  event.waitUntil(
    new Promise((resolve) => setTimeout(resolve, wait)).then(async () => {
      if (token !== restToken) return
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (windows.some((client) => client.visibilityState === 'visible')) return
      await self.registration.showNotification(data.title, {
        body: data.body,
        tag: 'nabd-rest',
        renotify: true,
        icon: 'icons/icon-192.png',
        badge: 'icons/icon-192.png',
        vibrate: [180, 90, 180],
        data: { url: '/workout' },
      })
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => 'focus' in client)
      return open ? open.focus() : self.clients.openWindow('/workout')
    }),
  )
})
