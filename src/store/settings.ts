import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_SETTINGS, type Settings } from '@/types'

/**
 * Settings live in localStorage (not IndexedDB) so they are readable synchronously on boot:
 * language and direction must be right on the very first paint.
 */
interface SettingsStore extends Settings {
  set: (patch: Partial<Settings>) => void
  replace: (next: Settings) => void
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (patch) => set(patch),
      replace: (next) => set({ ...DEFAULT_SETTINGS, ...next }),
    }),
    { name: 'nabd-settings', version: 1 },
  ),
)

/** Plain snapshot without the store actions — for backups and non-React code. */
export function getSettings(): Settings {
  const { set: _set, replace: _replace, ...rest } = useSettings.getState()
  return rest
}
