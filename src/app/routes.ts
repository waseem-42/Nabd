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
  motionBatch: '/motion-batch',
  /** Printable sheet for a coach; open without onboarding. */
  coachReview: '/coach-review',

  onboarding: '/onboarding',
  programs: '/programs',
  program: (templateId: string) => `/programs/${templateId}`,
  /** Edit a routine; pass 'new' to create one. */
  routine: (id: string) => `/routine/${id}`,

  /** The active session — full screen, no tab bar. */
  workout: '/workout',
  summary: (sessionId: string) => `/summary/${sessionId}`,
} as const

/** Three tabs; settings sit behind the gear icon in the header. */
export const TABS = [
  { key: 'today', path: routes.today, label: 'app.tab.train' },
  { key: 'library', path: routes.library, label: 'app.tab.exercises' },
  { key: 'progress', path: routes.progress, label: 'app.tab.log' },
] as const

export type TabKey = (typeof TABS)[number]['key']
