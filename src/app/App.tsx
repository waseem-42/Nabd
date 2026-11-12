import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { dirOf, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { Brand } from '@/ui/Brand'
import { IconButton } from '@/ui/IconButton'
import { PlaceToggle } from '@/ui/PlaceToggle'
import { TabBar } from '@/ui/TabBar'
import { ToastProvider } from '@/ui/Toast'
import { routes } from './routes'

const Home = lazy(() => import('@/screens/Home'))
const Exercises = lazy(() => import('@/screens/Exercises'))
const Exercise = lazy(() => import('@/screens/Exercise'))
const Log = lazy(() => import('@/screens/Log'))
const SessionDetail = lazy(() => import('@/screens/SessionDetail'))
const Preferences = lazy(() => import('@/screens/Preferences'))
const Setup = lazy(() => import('@/screens/Setup'))
const Plans = lazy(() => import('@/screens/Plans'))
const RoutineEdit = lazy(() => import('@/screens/RoutineEdit'))
const Train = lazy(() => import('@/screens/Train'))
const Summary = lazy(() => import('@/screens/Summary'))
const Gallery = lazy(() => import('@/ui/Gallery'))
const BrandGuide = lazy(() => import('@/screens/BrandGuide'))
const MotionBatch = lazy(() => import('@/screens/MotionBatch'))
const CoachReview = lazy(() => import('@/screens/CoachReview'))

/** Keeps <html lang dir> in sync with the chosen language. */
function useDocumentLanguage() {
  const lang = useSettings((s) => s.lang)
  const t = useT()
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dirOf(lang)
    document.title = `${t('common.appName')} — ${t('brand.tagline')}`
  }, [lang, t])
}

/** Everything behind the first-run setup. */
function RequireOnboarded() {
  const onboarded = useSettings((s) => s.onboarded)
  return onboarded ? <Outlet /> : <Navigate to={routes.onboarding} replace />
}

/**
 * The tab screens. The place switch sits on top of every tab: the plan, the exercises and
 * the log all follow it, and the whole shell takes the place's colour.
 */
function TabLayout() {
  const t = useT()
  const navigate = useNavigate()
  const place = useSettings((s) => s.place)
  const setSettings = useSettings((s) => s.set)
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip" data-place={place}>
      <header className="sticky top-0 z-20 bg-bg/95 px-5 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Brand />
          <IconButton label={t('app.settings')} icon={<Settings2 className="size-5" />} onClick={() => navigate(routes.settings)} />
        </div>
        <PlaceToggle value={place} onChange={(next) => setSettings({ place: next })} size="md" />
      </header>
      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}

/** Sub-screens and the workout: full height, no tab bar. */
function PlainLayout() {
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip">
      <Outlet />
    </div>
  )
}

export function App() {
  useDocumentLanguage()
  return (
    <ToastProvider>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {import.meta.env.DEV && <Route path="/dev/brand" element={<BrandGuide />} />}
          <Route element={<PlainLayout />}>
            <Route path={routes.onboarding} element={<Setup />} />
            <Route path={routes.motionBatch} element={<MotionBatch />} />
            <Route path={routes.coachReview} element={<CoachReview />} />
            {import.meta.env.DEV && <Route path="/dev/ui" element={<Gallery />} />}
          </Route>
          <Route element={<RequireOnboarded />}>
            <Route element={<TabLayout />}>
              <Route path={routes.today} element={<Home />} />
              <Route path={routes.library} element={<Exercises />} />
              <Route path={routes.progress} element={<Log />} />
            </Route>
            <Route element={<PlainLayout />}>
              <Route path="/library/:id" element={<Exercise />} />
              <Route path="/progress/session/:id" element={<SessionDetail />} />
              <Route path={routes.settings} element={<Preferences />} />
              <Route path={routes.programs} element={<Plans />} />
              <Route path="/routine/:id" element={<RoutineEdit />} />
              <Route path={routes.workout} element={<Train />} />
              <Route path="/summary/:id" element={<Summary />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to={routes.today} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ToastProvider>
  )
}
