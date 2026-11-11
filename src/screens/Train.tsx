import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Flame, ListOrdered, MoreHorizontal, Plus, Repeat2, Trash2, TriangleAlert, X } from 'lucide-react'
import { routes } from '@/app/routes'
import { unlockAudio, vibrate } from '@/app/feedback'
import { useNow } from '@/app/useNow'
import { useWakeLock } from '@/app/useWakeLock'
import { useAllExercises, useDoneSessions } from '@/db'
import { animatedFor } from '@/domain/animated'
import { bodyweightShare, platesPerSide } from '@/domain/loading'
import { alternativesFor } from '@/domain/place'
import { sessionDurationSec } from '@/domain/progress'
import { hasDoneSets } from '@/domain/session'
import { useLang, useT } from '@/i18n'
import { fmtClock, kgToUnit, unitToKg } from '@/i18n/format'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import type { Exercise, LoggedSet, WorkoutSession } from '@/types'
import { Button, ConfirmDialog, ExercisePickerSheet, IconButton, Sheet, Stepper, cx } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { ExerciseInfoSheet } from './parts/ExerciseInfoSheet'
import { RestPanel } from './parts/RestPanel'
import { WarmupCard } from './parts/WarmupCard'
import { WorkoutSafetySheet } from './parts/WorkoutSafetySheet'
import { useBodyProfile, useFormat, useHomeGear } from './parts/useFormat'

export default function Train() {
  const hydrated = useWorkout((s) => s.hydrated)
  const session = useWorkout((s) => s.session)
  // Set while finishing or discarding so the "no session" redirect doesn't race our own navigation.
  const [leaving, setLeaving] = useState(false)
  if (!hydrated || leaving) return null
  if (!session) return <Navigate to={routes.today} replace />
  return <Focus session={session} onLeave={() => setLeaving(true)} />
}

type Confirm = 'finish-empty' | 'finish-unfinished' | 'discard' | 'remove'
type Picker = { kind: 'add' } | { kind: 'swap' }

const firstUndoneEntry = (session: WorkoutSession) => Math.max(0, session.entries.findIndex((e) => e.sets.some((s) => !s.done)))

/** One exercise at a time: the moving figure on top, its sets below, a big "set done" button. */
function Focus({ session, onLeave }: { session: WorkoutSession; onLeave: () => void }) {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const gear = useHomeGear()
  const store = useWorkout()
  const now = useNow()
  const { exercises, byId } = useAllExercises()
  const history = useDoneSessions()
  useWakeLock(useSettings((s) => s.keepAwake))

  const [current, setCurrent] = useState(() => firstUndoneEntry(session))
  const [selected, setSelected] = useState<number | null>(null)
  const [menu, setMenu] = useState(false)
  const [list, setList] = useState(false)
  const [picker, setPicker] = useState<Picker | null>(null)
  const [info, setInfo] = useState<Exercise | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [safety, setSafety] = useState(false)
  const [busy, setBusy] = useState(false)

  const index = Math.min(current, Math.max(0, session.entries.length - 1))
  const entry = session.entries[index]
  const exercise = entry ? byId(entry.exerciseId) : undefined
  const mode = exercise?.mode ?? 'reps'
  const openSet = entry ? (selected !== null && entry.sets[selected] ? selected : entry.sets.findIndex((s) => !s.done)) : -1
  const totalSets = session.entries.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
  const pool = useMemo(() => animatedFor(exercises, session.place, gear), [exercises, session.place, gear])
  const recentIds = useMemo(() => {
    const ids: string[] = []
    for (const past of history ?? []) for (const e of past.entries) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)
    return ids.slice(0, 20)
  }, [history])
  const Back = lang === 'ar' ? ChevronRight : ChevronLeft
  const Forward = lang === 'ar' ? ChevronLeft : ChevronRight

  function done(setIndex: number) {
    unlockAudio()
    const wasDone = entry?.sets[setIndex]?.done
    store.toggleSet(index, setIndex)
    setSelected(null)
    if (!wasDone) vibrate(30)
  }

  function go(to: number) {
    setCurrent(Math.max(0, Math.min(session.entries.length - 1, to)))
    setSelected(null)
  }

  function requestFinish() {
    if (!hasDoneSets(session)) setConfirm('finish-empty')
    else if (session.entries.some((e) => e.sets.some((s) => !s.done))) setConfirm('finish-unfinished')
    else void finish()
  }
  async function finish() {
    setBusy(true)
    onLeave()
    const id = await store.finish()
    navigate(routes.summary(id), { replace: true })
  }
  async function discard() {
    onLeave()
    await store.discard()
    navigate(routes.today, { replace: true })
  }
  async function picked(next: Exercise) {
    const mode$ = picker
    setPicker(null)
    if (mode$?.kind === 'swap') await store.swapExercise(index, next.id)
    else {
      await store.addExercise(next.id)
      go(useWorkout.getState().session!.entries.length - 1)
    }
  }

  const alternatives = exercise ? alternativesFor(exercise, pool, session.place, gear, { exclude: session.entries.map((e) => e.exerciseId), limit: 6 }) : []
  const allSetsDone = !!entry && entry.sets.every((s) => s.done)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 bg-bg/95 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <IconButton label={t('app.w.leave')} icon={<Back className="size-6" />} onClick={() => navigate(routes.today)} />
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-sm font-semibold">{fmt.sessionName(session)}</p>
            <p className="text-xs text-muted tabular-nums">{fmtClock(sessionDurationSec(session, now))}</p>
          </div>
          <Button size="md" variant={doneSets === totalSets && totalSets > 0 ? 'primary' : 'secondary'} onClick={requestFinish} loading={busy}>{t('workout.finish')}</Button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={doneSets}>
          <div className="h-full rounded-pill bg-accent transition-[width]" style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} />
        </div>
        {store.rest && <div className="mt-3"><RestPanel rest={store.rest} /></div>}
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {doneSets === 0 && <WarmupCard session={session} lookup={byId} collapsed />}

        {!entry ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
            <p className="text-lg text-muted">{t('workout.emptyTitle')}</p>
            <Button icon={<Plus className="size-5" />} onClick={() => setPicker({ kind: 'add' })}>{t('workout.addExercise')}</Button>
          </div>
        ) : (
          <>
            <section className="overflow-hidden rounded-card border border-line bg-surface">
              <button type="button" onClick={() => exercise && setInfo(exercise)} className="relative block w-full" aria-label={t('app.w.watch')}>
                <MotionThumb exerciseId={entry.exerciseId} art={exercise?.art} name={fmt.exerciseName(entry.exerciseId)} className="aspect-[4/3] w-full" />
                <span className="absolute start-3 top-3 rounded-pill bg-bg/80 px-3 py-1 text-xs font-semibold tabular-nums backdrop-blur">
                  {t('app.w.of', { n: fmt.number(index + 1), total: fmt.number(session.entries.length) })}
                </span>
              </button>
              <div className="flex items-start gap-2 px-4 pt-3 pb-2">
                <h1 className="min-w-0 flex-1 text-xl font-bold leading-snug">{fmt.exerciseName(entry.exerciseId)}</h1>
                <IconButton label={t('common.more')} icon={<MoreHorizontal className="size-5" />} onClick={() => setMenu(true)} />
              </div>

              <ol className="m-0 flex list-none flex-col gap-2 px-3 pb-3">
                {entry.sets.map((set, s) => {
                  const open = s === openSet
                  return (
                    <li key={s}>
                      <div className={cx('flex min-h-14 items-center gap-3 rounded-control border px-3', open ? 'border-accent/40 bg-accent-soft' : set.done ? 'border-ok/25 bg-ok-soft' : 'border-line bg-bg')}>
                        <button type="button" onClick={() => setSelected(s)} className="flex min-h-12 flex-1 items-center gap-3 text-start">
                          <span className={cx('flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums', set.kind === 'warmup' ? 'bg-warn-soft text-warn' : 'bg-surface-2')}>
                            {set.kind === 'warmup' ? <Flame className="size-4" aria-label={t('common.warmup')} /> : fmt.number(entry.sets.slice(0, s + 1).filter((x) => x.kind !== 'warmup').length)}
                          </span>
                          <span className="text-lg font-semibold tabular-nums">{fmt.set(set, mode)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => done(s)}
                          aria-pressed={set.done}
                          aria-label={t('workout.setDone')}
                          className={cx('flex size-11 shrink-0 items-center justify-center rounded-full border-2', set.done ? 'border-ok bg-ok text-ok-ink' : 'border-line-strong text-muted')}
                        >
                          <Check className="size-5" aria-hidden />
                        </button>
                      </div>
                      {open && !set.done && (
                        <div className="px-1 pt-3">
                          <SetEditor set={set} exercise={exercise} onChange={(patch) => store.updateSet(index, s, patch)} />
                          <Button fullWidth size="lg" className="mt-3" icon={<Check className="size-6" />} onClick={() => done(s)}>{t('app.w.done')}</Button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
              {allSetsDone && (
                <div className="px-3 pb-4">
                  <p className="mb-3 text-center font-semibold text-ok">{t('app.w.allDone')}</p>
                  {index < session.entries.length - 1 ? (
                    <Button fullWidth size="lg" icon={<Forward className="size-6" />} onClick={() => go(index + 1)}>{t('app.w.next')}</Button>
                  ) : (
                    <Button fullWidth size="lg" onClick={requestFinish}>{t('workout.finish')}</Button>
                  )}
                </div>
              )}
            </section>
          </>
        )}

        <button type="button" onClick={() => { store.skipRest(); setSafety(true) }} className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-warn">
          <TriangleAlert className="size-4" aria-hidden />{t('app.w.pain')}
        </button>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md items-center gap-2 border-t border-line bg-bg/95 px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <IconButton label={t('app.w.prev')} icon={<Back className="size-6" />} disabled={index === 0} onClick={() => go(index - 1)} />
        <button type="button" onClick={() => setList(true)} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-control bg-surface-2 text-sm font-semibold">
          <ListOrdered className="size-5" aria-hidden />{t('app.w.list')}
        </button>
        <IconButton label={t('app.w.next')} icon={<Forward className="size-6" />} disabled={index >= session.entries.length - 1} onClick={() => go(index + 1)} />
      </nav>

      <Sheet open={list} onClose={() => setList(false)} title={t('app.w.list')}>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {session.entries.map((e, i) => {
            const finished = e.sets.every((s) => s.done)
            return (
              <li key={`${e.exerciseId}-${i}`}>
                <button type="button" onClick={() => { go(i); setList(false) }} className={cx('flex w-full items-center gap-3 rounded-control border p-2 text-start', i === index ? 'border-accent/40 bg-accent-soft' : 'border-line')}>
                  <MotionThumb exerciseId={e.exerciseId} name={fmt.exerciseName(e.exerciseId)} still className="size-14 rounded-control" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{fmt.exerciseName(e.exerciseId)}</span>
                    <span className="block text-xs text-muted tabular-nums">{fmt.number(e.sets.filter((s) => s.done).length)}/{fmt.number(e.sets.length)}</span>
                  </span>
                  {finished && <Check className="size-5 text-ok" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="mt-4 flex flex-col gap-2">
          <Button variant="secondary" fullWidth icon={<Plus className="size-5" />} onClick={() => { setList(false); setPicker({ kind: 'add' }) }}>{t('workout.addExercise')}</Button>
          <Button variant="danger" fullWidth icon={<Trash2 className="size-5" />} onClick={() => { setList(false); setConfirm('discard') }}>{t('workout.discard')}</Button>
        </div>
      </Sheet>

      <Sheet open={menu} onClose={() => setMenu(false)} title={entry ? fmt.exerciseName(entry.exerciseId) : ''}>
        <div className="flex flex-col gap-2">
          {alternatives.length > 0 && (
            <>
              <p className="flex items-center gap-2 text-sm text-muted"><Repeat2 className="size-4" aria-hidden />{t('workout.swapTitle')}</p>
              <div className="mb-2 grid grid-cols-3 gap-2">
                {alternatives.slice(0, 3).map((alt) => (
                  <button key={alt.id} type="button" onClick={() => { setMenu(false); void store.swapExercise(index, alt.id) }} className="overflow-hidden rounded-control border border-line text-start">
                    <MotionThumb exerciseId={alt.id} name={fmt.exerciseName(alt.id)} still className="aspect-square w-full" />
                    <span className="line-clamp-2 block p-2 text-xs font-semibold">{fmt.exerciseName(alt.id)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          <Button variant="secondary" fullWidth onClick={() => { setMenu(false); setPicker({ kind: 'swap' }) }}>{t('workout.swapSearch')}</Button>
          <Button variant="secondary" fullWidth icon={<Flame className="size-5" />} onClick={() => { setMenu(false); void store.addWarmups(index) }}>{t('app.w.warmups')}</Button>
          <Button variant="secondary" fullWidth icon={<Plus className="size-5" />} onClick={() => { setMenu(false); void store.addSet(index) }}>{t('workout.addSet')}</Button>
          {openSet >= 0 && entry && entry.sets.length > 1 && (
            <Button variant="ghost" fullWidth onClick={() => { setMenu(false); store.removeSet(index, openSet) }}>{t('workout.removeSet')}</Button>
          )}
          <Button variant="danger" fullWidth icon={<X className="size-5" />} onClick={() => { setMenu(false); setConfirm('remove') }}>{t('workout.removeExercise')}</Button>
        </div>
      </Sheet>

      <ExercisePickerSheet
        open={!!picker}
        onClose={() => setPicker(null)}
        exercises={pool}
        onPick={(next) => void picked(next)}
        title={picker?.kind === 'swap' ? t('workout.swapTitle') : t('workout.addExercise')}
        excludeIds={session.entries.map((e) => e.exerciseId)}
        recentIds={recentIds}
      />
      <ExerciseInfoSheet exercise={info} onClose={() => setInfo(null)} />
      <WorkoutSafetySheet open={safety} onClose={() => setSafety(false)} onFinish={() => void finish()} busy={busy} />

      <ConfirmDialog open={confirm === 'finish-empty'} title={t('workout.emptyFinishTitle')} message={t('workout.emptyFinishBody')} confirmLabel={t('workout.discard')} tone="danger" onConfirm={() => void discard()} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === 'finish-unfinished'} title={t('workout.unfinishedTitle')} message={t('workout.unfinishedBody')} confirmLabel={t('workout.finish')} onConfirm={() => { setConfirm(null); void finish() }} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === 'discard'} title={t('workout.discardTitle')} message={t('workout.discardBody')} confirmLabel={t('workout.discard')} tone="danger" onConfirm={() => void discard()} onCancel={() => setConfirm(null)} />
      <ConfirmDialog open={confirm === 'remove'} title={t('workout.removeTitle')} confirmLabel={t('common.delete')} tone="danger" onConfirm={() => { setConfirm(null); store.removeExercise(index); go(index - 1 < 0 ? 0 : index) }} onCancel={() => setConfirm(null)} />
    </div>
  )
}

/** Big steppers for the open set: weight and reps, or seconds for holds. */
function SetEditor({ set, exercise, onChange }: { set: LoggedSet; exercise: Exercise | undefined; onChange: (patch: Partial<Pick<LoggedSet, 'weight' | 'reps' | 'sec'>>) => void }) {
  const t = useT()
  const fmt = useFormat()
  const profile = useBodyProfile()
  if (exercise?.mode === 'time') {
    return <Stepper label={t('workout.seconds')} value={set.sec ?? 0} onChange={(sec) => onChange({ sec })} step={5} max={3600} unit={t('common.sec')} />
  }
  const bodyweight = exercise?.equipment === 'bodyweight'
  const share = exercise ? bodyweightShare(exercise) : null
  const plates = exercise?.equipment === 'barbell' && set.weight > 0 ? platesPerSide(set.weight, fmt.unit) : null
  const weight = (
    <div>
      <p className="mb-1 text-center text-sm text-muted">{bodyweight ? t('workout.addedWeight') : t('workout.weight')}</p>
      <Stepper label={bodyweight ? t('workout.addedWeight') : t('workout.weight')} value={Math.round(kgToUnit(set.weight, fmt.unit) * 10) / 10} onChange={(v) => onChange({ weight: Math.round(unitToKg(v, fmt.unit) * 1000) / 1000 })} step={fmt.unit === 'kg' ? 2.5 : 5} decimals={1} max={1000} unit={fmt.unitLabel} />
    </div>
  )
  const reps = (
    <div>
      <p className="mb-1 text-center text-sm text-muted">{t('workout.reps')}</p>
      <Stepper label={t('workout.reps')} value={set.reps} onChange={(r) => onChange({ reps: r })} max={200} unit={t('common.reps')} />
    </div>
  )
  return (
    <div className="flex flex-col gap-3">
      {bodyweight ? reps : weight}
      {bodyweight ? null : reps}
      {share !== null && profile.kg !== null && (
        <p className="text-center text-sm text-muted">{t('body.effectiveLoad', { load: fmt.weightWithUnit(Math.round(profile.kg * share + set.weight)) })}</p>
      )}
      {plates && plates.plates.length > 0 && (
        <div className="flex items-center justify-center gap-1" dir="ltr" aria-label={`${t('body.plates')}: ${plates.plates.join(' + ')} ${fmt.unitLabel}`}>
          <span className="h-2 w-6 rounded-s-full bg-line-strong" aria-hidden />
          {plates.plates.map((p, i) => (
            <span key={i} className="flex w-7 items-center justify-center rounded-[0.3rem] bg-accent text-[0.65rem] font-bold tabular-nums text-accent-ink" style={{ height: `${Math.round(22 + (p / Math.max(...plates.plates)) * 30)}px` }}>{p}</span>
          ))}
        </div>
      )}
    </div>
  )
}
