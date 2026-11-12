import type { CapacitorConfig } from '@capacitor/cli'

// Android test build: wraps the production web build (dist/) in a native shell.
// Build: npm run android:apk → android/app/build/outputs/apk/debug/app-debug.apk
const config: CapacitorConfig = {
  appId: 'io.github.waseem42.nabd',
  appName: 'نبض',
  webDir: 'dist',
  backgroundColor: '#111310',
}

export default config
