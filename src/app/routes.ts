/**
 * Every path in the app. Navigate with these helpers, never with string literals, so a route
 * change is one edit.
 */
export const routes = {
  today: '/',
  library: '/library',
  exercise: (id: string) => `/library/${encodeURIComponent(id)}`,
  progress: '/progress',
  session: (id: string) => `/progress/session/${id}`,
  settings: '/settings',
  motionLab: '/motion-lab',
  motionBatch: '/motion-batch',

  onboarding: '/onboarding',
  programs: '/programs',
  program: (templateId: string) => `/programs/${templateId}`,
  /** Edit a routine; pass 'new' to create one. */
  routine: (id: string) => `/routine/${id}`,

  /** The active session — full screen, no tab bar. */
  workout: '/workout',
  summary: (sessionId: string) => `/summary/${sessionId}`,
} as const

export const TABS = [
  { key: 'today', path: routes.today, label: 'common.tab.today' },
  { key: 'library', path: routes.library, label: 'common.tab.library' },
  { key: 'progress', path: routes.progress, label: 'common.tab.progress' },
  { key: 'settings', path: routes.settings, label: 'common.tab.settings' },
] as const

export type TabKey = (typeof TABS)[number]['key']
