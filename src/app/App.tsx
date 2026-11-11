import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { dirOf, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { Brand } from '@/ui/Brand'
import { TabBar } from '@/ui/TabBar'
import { ToastProvider } from '@/ui/Toast'
import { SafetyProvider } from './SafetyProvider'

const Today = lazy(() => import('@/screens/Today'))
const Library = lazy(() => import('@/screens/Library'))
const ExerciseDetail = lazy(() => import('@/screens/ExerciseDetail'))
const Progress = lazy(() => import('@/screens/Progress'))
const SessionDetail = lazy(() => import('@/screens/SessionDetail'))
const Settings = lazy(() => import('@/screens/Settings'))
const Onboarding = lazy(() => import('@/screens/Onboarding'))
const Programs = lazy(() => import('@/screens/Programs'))
const ProgramDetail = lazy(() => import('@/screens/ProgramDetail'))
const RoutineEdit = lazy(() => import('@/screens/RoutineEdit'))
const Workout = lazy(() => import('@/screens/Workout'))
const Summary = lazy(() => import('@/screens/Summary'))
const Gallery = lazy(() => import('@/ui/Gallery'))
const BrandGuide = lazy(() => import('@/screens/BrandGuide'))
const MotionLab = lazy(() => import('@/screens/MotionLab'))
const MotionBatch = lazy(() => import('@/screens/MotionBatch'))

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

/** Everything behind onboarding. */
function RequireOnboarded() {
  const onboarded = useSettings((s) => s.onboarded)
  return onboarded ? <Outlet /> : <Navigate to="/onboarding" replace />
}

/** The four tab screens: scrollable content above a fixed tab bar. */
function TabLayout() {
  const t = useT()
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="mx-5 flex items-center justify-between gap-4 border-b border-line pt-[calc(1.25rem+env(safe-area-inset-top))] pb-5">
        <Brand />
        <p className="text-sm font-medium text-muted">{t('brand.tagline')}</p>
      </div>
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}

/** Sub-screens and the workout: full height, no tab bar. */
function PlainLayout() {
  return (
    <div className="app-shell mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <Outlet />
    </div>
  )
}

export function App() {
  useDocumentLanguage()
  return (
    <ToastProvider>
    <BrowserRouter>
      <SafetyProvider>
      <Suspense fallback={null}>
        <Routes>
          {import.meta.env.DEV && <Route path="/dev/brand" element={<BrandGuide />} />}
          <Route element={<PlainLayout />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/motion-lab" element={<MotionLab />} />
            <Route path="/motion-batch" element={<MotionBatch />} />
            {import.meta.env.DEV && <Route path="/dev/ui" element={<Gallery />} />}
          </Route>
          <Route element={<RequireOnboarded />}>
            <Route element={<TabLayout />}>
              <Route path="/" element={<Today />} />
              <Route path="/library" element={<Library />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route element={<PlainLayout />}>
              <Route path="/library/:id" element={<ExerciseDetail />} />
              <Route path="/progress/session/:id" element={<SessionDetail />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/routine/:id" element={<RoutineEdit />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/summary/:id" element={<Summary />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      </SafetyProvider>
    </BrowserRouter>
    </ToastProvider>
  )
}
