import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { App } from '@/app/App'
import { captureInstallPrompt } from '@/app/install'
import { startRestAlerts } from '@/app/restAlert'
import { dirOf } from '@/i18n'
import { initApp } from '@/store/session'
import { useSettings } from '@/store/settings'
import '@/styles/index.css'

// Set language and direction before the first paint (settings are synchronous).
const { lang } = useSettings.getState()
document.documentElement.lang = lang
document.documentElement.dir = dirOf(lang)

registerSW({ immediate: true })
captureInstallPrompt()

// Ask the browser to keep our data and restore a workout that was in progress.
void initApp().then(startRestAlerts)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
