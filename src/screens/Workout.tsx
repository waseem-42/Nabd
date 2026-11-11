import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Dumbbell,
  Flame,
  Info,
  Sparkles,
  TrendingUp,
  MoreVertical,
  Plus,
  Repeat,
  Timer,
  Trash2,
  TriangleAlert,
  Undo2,
} from 'lucide-react'
import { routes } from '@/app/routes'
import { unlockAudio, vibrate } from '@/app/feedback'
import { useNow } from '@/app/useNow'
import { useWakeLock } from '@/app/useWakeLock'
import { useAllExercises, useDoneSessions } from '@/db'
import { alternativesFor, filterForPlace, fitsPlace } from '@/domain/place'
import { lastPerformance, sessionDurationSec } from '@/domain/progress'
import { hasDoneSets } from '@/domain/session'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, kgToUnit, unitToKg } from '@/i18n/format'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import type { Exercise, LoggedSet, SessionEntry, WorkoutSession } from '@/types'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  cx,
  EmptyState,
  ExerciseArt,
  ExercisePickerSheet,
  ExerciseRow,
  IconButton,
  ListRow,
  Screen,
  Sheet,
  Stepper,
} from '@/ui'
import { ExerciseInfoSheet } from './parts/ExerciseInfoSheet'
import { RestPanel } from './parts/RestPanel'
import { WorkoutSafetySheet } from './parts/WorkoutSafetySheet'
import { WarmupCard } from './parts/WarmupCard'
import { useBodyProfile, useFormat, useHomeGear } from './parts/useFormat'
import { bodyweightShare, platesPerSide } from '@/domain/loading'
import { warmupFor } from '@/domain/session'

interface SetRef {
  e: number
  s: number
}

/** The first set not done yet, looking after `from` first and then wrapping around. */
function nextUndone(session: WorkoutSession, from?: SetRef): SetRef | null {
  const flat: SetRef[] = session.entries.flatMap((entry, e) => entry.sets.map((_, s) => ({ e, s })))
  const start = from ? flat.findIndex((r) => r.e === from.e && r.s === from.s) + 1 : 0
  for (let i = 0; i < flat.length; i++) {
    const r = flat[(start + i) % flat.length]!
    if (!session.entries[r.e]!.sets[r.s]!.done) return r
  }
  return null
}

export default function Workout() {
  const hydrated = useWorkout((s) => s.hydrated)
  const session = useWorkout((s) => s.session)
  // Set while finishing or discarding so the "no session" redirect doesn't race our own navigation.
  const [leaving, setLeaving] = useState(false)
  if (!hydrated || leaving) return null
  if (!session) return <Navigate to={routes.today} replace />
  return <ActiveWorkout session={session} onLeave={() => setLeaving(true)} />
}

type Confirm = 'finish-empty' | 'finish-unfinished' | 'discard' | { removeEntry: number }
type PickerMode = { kind: 'add' } | { kind: 'swap'; entry: number }

function ActiveWorkout({ session, onLeave }: { session: WorkoutSession; onLeave: () => void }) {
  const t = useT()
  const navigate = useNavigate()
  const fmt = useFormat()
  const gear = useHomeGear()
  const { exercises, byId } = useAllExercises()
  const history = useDoneSessions()
  const store = useWorkout()
  const now = useNow()
  const profile = useBodyProfile()
  useWakeLock(useSettings((s) => s.keepAwake))
  const totalSets = session.entries.reduce((n, e) => n + e.sets.length, 0)
  const doneSets = session.entries.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)
  // Most recently trained first, for the top of the exercise picker.
  const recentIds = useMemo(() => {
    const ids: string[] = []
    for (const past of history ?? []) for (const e of past.entries) if (!ids.includes(e.exerciseId)) ids.push(e.exerciseId)
    return ids.slice(0, 30)
  }, [history])

  const [focus, setFocus] = useState<SetRef | null>(() => nextUndone(session))
  const [menu, setMenu] = useState<number | null>(null)
  const [swap, setSwap] = useState<number | null>(null)
  const [picker, setPicker] = useState<PickerMode | null>(null)
  const [info, setInfo] = useState<Exercise | null>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [busy, setBusy] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)

  const place = session.place
  const placeExercises = useMemo(() => filterForPlace(exercises, place, gear), [exercises, place, gear])
  const inSession = useMemo(() => session.entries.map((e) => e.exerciseId), [session.entries])

  function toggle(e: number, s: number) {
    unlockAudio()
    const wasDone = session.entries[e]?.sets[s]?.done
    store.toggleSet(e, s)
    if (!wasDone) {
      vibrate(30)
      const next = useWorkout.getState().session
      setFocus(next ? nextUndone(next, { e, s }) : null)
    }
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

  async function pick$(exercise: Exercise) {
    const mode = picker
    setPicker(null)
    if (mode?.kind === 'swap') {
      await store.swapExercise(mode.entry, exercise.id)
    } else {
      await store.addExercise(exercise.id)
      const s = useWorkout.getState().session
      if (s) setFocus({ e: s.entries.length - 1, s: 0 })
    }
  }

  const menuEntry = menu !== null ? session.entries[menu] : undefined
  const swapEntry = swap !== null ? session.entries[swap] : undefined
  const swapExercise = swapEntry ? byId(swapEntry.exerciseId) : undefined

  return (
    <Screen
      title={fmt.sessionName(session)}
      subtitle={`${fmtClock(sessionDurationSec(session, now))} · ${t(`common.place.${place}`)}`}
      onBack={() => navigate(routes.today)}
      actions={
        <IconButton label={t('workout.discard')} icon={<Trash2 className="size-5" />} onClick={() => setConfirm('discard')} />
      }
      footer={
        <>
          <button type="button" onClick={() => { store.skipRest(); setSafetyOpen(true) }} className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-control border border-warn/30 bg-surface-2 px-3 text-sm font-semibold text-warn">
            <TriangleAlert className="size-4" aria-hidden />{t('safety.help')}
          </button>
          {store.rest && <RestPanel rest={store.rest} />}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" icon={<Plus className="size-5" />} onClick={() => setPicker({ kind: 'add' })}>
              {t('workout.addExercise')}
            </Button>
            <Button icon={<Check className="size-5" />} loading={busy} onClick={requestFinish}>
              {t('workout.finish')}
            </Button>
          </div>
        </>
      }
    >
      {session.entries.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="size-8" />}
          title={t('workout.emptyTitle')}
          body={t('workout.emptyBody')}
          action={
            <Button icon={<Plus className="size-5" />} onClick={() => setPicker({ kind: 'add' })}>
              {t('workout.addExercise')}
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 px-5 pt-2">
          {totalSets > 0 && (
            <div className="sticky top-0 z-10 -mx-5 bg-bg/92 px-5 py-2 backdrop-blur" role="progressbar" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={doneSets} aria-label={t('workout.progress', { done: doneSets, total: totalSets })}>
              <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line">
                  <div className={cx('h-full rounded-pill transition-[width] duration-300', doneSets === totalSets ? 'bg-ok' : 'bg-accent')} style={{ width: `${(doneSets / totalSets) * 100}%` }} />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted">{t('workout.progress', { done: fmt.number(doneSets), total: fmt.number(totalSets) })}</span>
              </div>
            </div>
          )}
          <WarmupCard session={session} lookup={byId} />
          {session.entries.map((entry, e) => {
            const exercise = byId(entry.exerciseId)
            return (
              <EntryCard
                key={`${e}-${entry.exerciseId}`}
                entry={entry}
                exercise={exercise}
                fits={exercise ? fitsPlace(exercise, place, gear) : true}
                lastSets={history ? (lastPerformance(history, entry.exerciseId)?.sets ?? null) : null}
                focusedSet={focus?.e === e ? focus.s : null}
                onFocus={(s) => setFocus(focus?.e === e && focus.s === s ? null : { e, s })}
                onToggle={(s) => toggle(e, s)}
                onUpdate={(s, patch) => store.updateSet(e, s, patch)}
                onRemoveSet={(s) => {
                  store.removeSet(e, s)
                  setFocus(null)
                }}
                onAddSet={async () => {
                  await store.addSet(e)
                  setFocus({ e, s: entry.sets.length })
                }}
                onMenu={() => setMenu(e)}
                onSwap={() => setSwap(e)}
                onInfo={() => exercise && setInfo(exercise)}
              />
            )
          })}
        </div>
      )}

      <WorkoutSafetySheet open={safetyOpen} onClose={() => setSafetyOpen(false)} onFinish={() => void finish()} busy={busy} />

      {/* Entry actions */}
      <Sheet open={!!menuEntry} onClose={() => setMenu(null)} title={menuEntry ? fmt.exerciseName(menuEntry.exerciseId) : ''}>
        {menuEntry && menu !== null && (
          <div className="-mx-4 flex flex-col">
            <ListRow
              leading={<Repeat className="size-5 text-muted" />}
              title={t('workout.swap')}
              onClick={() => {
                setMenu(null)
                setSwap(menu)
              }}
            />
            {!menuEntry.sets.some((x) => x.kind === 'warmup') && (
              <ListRow
                leading={<Flame className="size-5 text-warn" />}
                title={t('body.addWarmups')}
                subtitle={warmupFor(menuEntry, { lookup: byId, profile }).length ? undefined : t('body.noWarmupNeeded')}
                disabled={!warmupFor(menuEntry, { lookup: byId, profile }).length}
                onClick={() => {
                  const index = menu
                  setMenu(null)
                  void store.addWarmups(index).then(() => setFocus(nextUndone(useWorkout.getState().session!)))
                }}
              />
            )}
            {byId(menuEntry.exerciseId) && (
              <ListRow
                leading={<Info className="size-5 text-muted" />}
                title={t('workout.howTo')}
                onClick={() => {
                  setMenu(null)
                  setInfo(byId(menuEntry.exerciseId) ?? null)
                }}
              />
            )}
            <ListRow
              leading={<ArrowUp className="size-5 text-muted" />}
              title={t('common.moveUp')}
              disabled={menu === 0}
              onClick={() => {
                store.moveExercise(menu, menu - 1)
                setMenu(menu - 1)
                setFocus(null)
              }}
            />
            <ListRow
              leading={<ArrowDown className="size-5 text-muted" />}
              title={t('common.moveDown')}
              disabled={menu === session.entries.length - 1}
              onClick={() => {
                store.moveExercise(menu, menu + 1)
                setMenu(menu + 1)
                setFocus(null)
              }}
            />
            <div className="px-4 py-3">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
                <Timer className="size-4" aria-hidden />
                {t('workout.restBetween')}
              </p>
              <Stepper
                label={t('workout.restBetween')}
                value={menuEntry.restSec}
                onChange={(restSec) => store.updateEntry(menu, { restSec })}
                step={15}
                min={0}
                max={600}
                unit={t('common.sec')}
              />
            </div>
            <ListRow
              leading={<Trash2 className="size-5 text-danger" />}
              title={<span className="text-danger">{t('workout.removeExercise')}</span>}
              onClick={() => {
                setMenu(null)
                setConfirm({ removeEntry: menu })
              }}
            />
          </div>
        )}
      </Sheet>

      {/* Swap: same-muscle alternatives that fit this place */}
      <Sheet open={!!swapEntry} onClose={() => setSwap(null)} title={t('workout.swapTitle')}>
        {swapEntry && swap !== null && (
          <SwapList
            entry={swapEntry}
            exercise={swapExercise}
            alternatives={
              swapExercise ? alternativesFor(swapExercise, exercises, place, gear, { exclude: inSession, limit: 12 }) : []
            }
            onPick={(id) => {
              setSwap(null)
              void store.swapExercise(swap, id)
            }}
            onSearch={() => {
              setSwap(null)
              setPicker({ kind: 'swap', entry: swap })
            }}
          />
        )}
      </Sheet>

      <ExercisePickerSheet
        open={!!picker}
        onClose={() => setPicker(null)}
        exercises={placeExercises}
        excludeIds={inSession}
        recentIds={recentIds}
        title={picker?.kind === 'swap' ? t('workout.swapTitle') : t('workout.addExercise')}
        onPick={(ex) => void pick$(ex)}
      />

      <ExerciseInfoSheet exercise={info} onClose={() => setInfo(null)} />

      <ConfirmDialog
        open={confirm === 'finish-empty'}
        title={t('workout.emptyFinishTitle')}
        message={t('workout.emptyFinishBody')}
        confirmLabel={t('workout.discard')}
        tone="danger"
        onConfirm={() => void discard()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'finish-unfinished'}
        title={t('workout.unfinishedTitle')}
        message={t('workout.unfinishedBody')}
        confirmLabel={t('workout.finish')}
        onConfirm={() => {
          setConfirm(null)
          void finish()
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'discard'}
        title={t('workout.discardTitle')}
        message={t('workout.discardBody')}
        confirmLabel={t('workout.discard')}
        tone="danger"
        onConfirm={() => void discard()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={typeof confirm === 'object' && confirm !== null}
        title={t('workout.removeTitle')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={() => {
          if (typeof confirm === 'object' && confirm) store.removeExercise(confirm.removeEntry)
          setConfirm(null)
          setFocus(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </Screen>
  )
}

// ── One exercise in the session ─────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: SessionEntry
  exercise: Exercise | undefined
  fits: boolean
  lastSets: LoggedSet[] | null
  focusedSet: number | null
  onFocus: (setIndex: number) => void
  onToggle: (setIndex: number) => void
  onUpdate: (setIndex: number, patch: Partial<Pick<LoggedSet, 'weight' | 'reps' | 'sec' | 'kind'>>) => void
  onRemoveSet: (setIndex: number) => void
  onAddSet: () => void
  onMenu: () => void
  onSwap: () => void
  onInfo: () => void
}

function EntryCard({
  entry,
  exercise,
  fits,
  lastSets,
  focusedSet,
  onFocus,
  onToggle,
  onUpdate,
  onRemoveSet,
  onAddSet,
  onMenu,
  onSwap,
  onInfo,
}: EntryCardProps) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const mode = exercise?.mode ?? 'reps'
  const name = exercise ? pick(exercise.name, lang) : t('common.unknownExercise')
  const doneCount = entry.sets.filter((s) => s.done).length
  const complete = entry.sets.length > 0 && doneCount === entry.sets.length

  return (
    <Card padded={false} className={cx('overflow-hidden', complete && 'border-ok/30')}>
      <div className="flex items-center gap-3 p-4 pb-3">
        <button type="button" onClick={onInfo} className="shrink-0 rounded-2xl" aria-label={`${t('workout.howTo')}: ${name}`}>
          <ExerciseArt slug={exercise?.art ?? null} activity={exercise?.id} still name={name} className="size-14 rounded-2xl" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-text">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {exercise && <Badge tone="accent">{t(`common.muscle.${exercise.primary}`)}</Badge>}
            <Badge tone={complete ? 'ok' : 'neutral'}>
              {doneCount}/{entry.sets.length}
            </Badge>
          </div>
        </div>
        <IconButton label={t('common.more')} icon={<MoreVertical className="size-5" />} onClick={onMenu} />
      </div>

      {entry.swappedFrom && (
        <p className="-mt-1 px-4 pb-2 text-sm text-faint">{t('workout.swappedFrom', { name: fmt.exerciseName(entry.swappedFrom) })}</p>
      )}

      {!fits && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-control bg-warn-soft p-3">
          <TriangleAlert className="size-5 shrink-0 text-warn" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-warn">{t('workout.notFit')}</p>
          <Button variant="secondary" className="min-h-10 shrink-0 px-4 text-sm" onClick={onSwap}>
            {t('workout.swapShort')}
          </Button>
        </div>
      )}

      {entry.prefill && !entry.sets.some((x) => x.done && x.kind === 'normal') && (
        <p className="mx-4 mb-2 flex items-start gap-2 rounded-control bg-accent-soft p-3 text-sm leading-relaxed text-text">
          {entry.prefill === 'progress' ? <TrendingUp className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden /> : <Sparkles className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />}
          <span>{t(entry.prefill === 'progress' ? 'body.hint.progress' : 'body.hint.body')}</span>
        </p>
      )}

      {lastSets && (
        <p className="truncate px-4 pb-2 text-sm text-muted">
          {t('workout.lastTime')}: <span dir="auto">{lastSets.map((s) => fmt.set(s, mode)).join(' · ')}</span>
        </p>
      )}

      <ul className="m-0 list-none border-t border-line p-0">
        {entry.sets.map((set, s) => {
          const open = focusedSet === s
          const warm = set.kind === 'warmup'
          return (
            <li key={s} className={cx('border-b border-line last:border-b-0', open && 'bg-surface-2/60')}>
              <div className="flex min-h-16 items-center gap-3 ps-4 pe-3">
                <button
                  type="button"
                  onClick={() => onFocus(s)}
                  aria-expanded={open}
                  className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-start"
                >
                  <span
                    className={cx(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums',
                      warm ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted',
                    )}
                    aria-label={warm ? t('common.warmup') : undefined}
                  >
                    {warm ? t('common.warmupShort') : s + 1 - entry.sets.slice(0, s).filter((x) => x.kind === 'warmup').length}
                  </span>
                  <span
                    className={cx('truncate text-xl font-semibold tabular-nums', set.done ? 'text-muted' : 'text-text')}
                    dir="auto"
                  >
                    {fmt.set(set, mode)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={set.done}
                  aria-label={t('workout.setDone', { n: s + 1 })}
                  onClick={() => onToggle(s)}
                  className={cx(
                    'flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-[background-color,transform] active:scale-90',
                    set.done ? 'border-ok bg-ok text-ok-ink' : 'border-line-strong text-faint',
                  )}
                >
                  <Check className="size-6" strokeWidth={3} aria-hidden />
                </button>
              </div>
              {open && <SetEditor set={set} mode={mode} exercise={exercise} onChange={(p) => onUpdate(s, p)} />}
              {open && !set.done && (
                <div className="px-4 pb-3">
                  <Button size="lg" fullWidth icon={<Check className="size-6" strokeWidth={3} />} onClick={() => onToggle(s)}>
                    {t('workout.doneSet')}
                  </Button>
                </div>
              )}
              {open && (
                <div className="flex gap-2 px-4 pb-4">
                  <Button variant="secondary" className="min-h-10 flex-1 text-sm" onClick={() => onUpdate(s, { kind: warm ? 'normal' : 'warmup' })}>
                    {warm ? t('workout.markWork') : t('workout.markWarmup')}
                  </Button>
                  <Button variant="danger" className="min-h-10 flex-1 text-sm" icon={<Trash2 className="size-4" />} onClick={() => onRemoveSet(s)}>
                    {t('workout.removeSet')}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-line px-2 py-1">
        <Button variant="ghost" className="text-accent" icon={<Plus className="size-5" />} onClick={onAddSet}>
          {t('workout.addSet')}
        </Button>
        <span className="flex items-center gap-1.5 pe-3 text-sm text-faint">
          <Timer className="size-4" aria-hidden />
          <span className="tabular-nums">{fmtClock(entry.restSec)}</span>
        </span>
      </div>
    </Card>
  )
}

/** Big steppers for the open set; what they edit depends on how the exercise is measured. */
function SetEditor({
  set,
  mode,
  exercise,
  onChange,
}: {
  set: LoggedSet
  mode: Exercise['mode']
  exercise: Exercise | undefined
  onChange: (patch: Partial<Pick<LoggedSet, 'weight' | 'reps' | 'sec'>>) => void
}) {
  const t = useT()
  const fmt = useFormat()
  const profile = useBodyProfile()
  const bodyweight = exercise?.equipment === 'bodyweight'
  const share = exercise ? bodyweightShare(exercise) : null
  const plates = exercise?.equipment === 'barbell' && set.weight > 0 ? platesPerSide(set.weight, fmt.unit) : null

  if (mode === 'time') {
    return (
      <div className="px-4 pb-3">
        <Stepper label={t('workout.seconds')} value={set.sec ?? 0} onChange={(sec) => onChange({ sec })} step={5} max={3600} unit={t('common.sec')} />
      </div>
    )
  }
  if (mode === 'cardio') {
    return (
      <div className="px-4 pb-3">
        <Stepper
          label={t('workout.minutes')}
          value={Math.round((set.sec ?? 0) / 60)}
          onChange={(min) => onChange({ sec: min * 60 })}
          max={600}
          unit={t('common.min')}
        />
      </div>
    )
  }

  const weight = (
    <div>
      <p className="mb-1 text-center text-sm text-muted">{bodyweight ? t('workout.addedWeight') : t('workout.weight')}</p>
      <Stepper
        label={bodyweight ? t('workout.addedWeight') : t('workout.weight')}
        value={Math.round(kgToUnit(set.weight, fmt.unit) * 10) / 10}
        onChange={(v) => onChange({ weight: Math.round(unitToKg(v, fmt.unit) * 1000) / 1000 })}
        step={fmt.unit === 'kg' ? 2.5 : 5}
        decimals={1}
        max={1000}
        unit={fmt.unitLabel}
      />
    </div>
  )
  const reps = (
    <div>
      <p className="mb-1 text-center text-sm text-muted">{t('workout.reps')}</p>
      <Stepper label={t('workout.reps')} value={set.reps} onChange={(r) => onChange({ reps: r })} max={200} unit={t('common.reps')} />
    </div>
  )
  return (
    <div className="flex flex-col gap-3 px-4 pb-3">
      {bodyweight ? (
        <>
          {reps}
          {weight}
        </>
      ) : (
        <>
          {weight}
          {reps}
        </>
      )}
      {share !== null && profile.kg !== null && (
        <p className="rounded-control bg-surface px-3 py-2 text-center text-sm text-muted">
          {t('body.effectiveLoad', { load: fmt.weightWithUnit(Math.round(profile.kg * share + set.weight)) })}
        </p>
      )}
      {plates && <PlateBar plates={plates} />}
    </div>
  )
}

/** Which plates go on each side of the bar for the current weight. */
function PlateBar({ plates }: { plates: NonNullable<ReturnType<typeof platesPerSide>> }) {
  const t = useT()
  const fmt = useFormat()
  const max = Math.max(...(plates.plates.length ? plates.plates : [1]))
  return (
    <div className="rounded-control bg-surface px-3 py-3">
      <p className="mb-2 text-center text-xs text-muted">
        {plates.plates.length ? t('body.plates') : t('body.emptyBar', { bar: `${fmt.number(plates.bar)} ${fmt.unitLabel}` })}
      </p>
      {plates.plates.length > 0 && (
        <div className="flex items-center justify-center gap-1" dir="ltr" aria-label={`${t('body.plates')}: ${plates.plates.join(' + ')} ${fmt.unitLabel}`}>
          <span className="h-2 w-6 rounded-s-full bg-line-strong" aria-hidden />
          {plates.plates.map((p, i) => (
            <span
              key={i}
              className="flex w-7 items-center justify-center rounded-[0.3rem] bg-accent text-[0.65rem] font-bold tabular-nums text-accent-ink"
              style={{ height: `${Math.round(22 + (p / max) * 34)}px` }}
            >
              {p}
            </span>
          ))}
          <span className="h-3 w-1.5 rounded-sm bg-line-strong" aria-hidden />
        </div>
      )}
      {plates.rest > 0 && <p className="mt-2 text-center text-xs text-warn">{t('body.platesRest', { rest: `${plates.rest} ${fmt.unitLabel}` })}</p>}
    </div>
  )
}

/** Swap choices: back to the original, ranked alternatives, or search everything that fits. */
function SwapList({
  entry,
  exercise,
  alternatives,
  onPick,
  onSearch,
}: {
  entry: SessionEntry
  exercise: Exercise | undefined
  alternatives: Exercise[]
  onPick: (exerciseId: string) => void
  onSearch: () => void
}) {
  const t = useT()
  const fmt = useFormat()
  return (
    <div className="flex flex-col gap-3">
      {entry.swappedFrom && (
        <Button variant="secondary" fullWidth icon={<Undo2 className="size-5" />} onClick={() => onPick(entry.swappedFrom!)}>
          {t('workout.swapBack', { name: fmt.exerciseName(entry.swappedFrom) })}
        </Button>
      )}
      {exercise && alternatives.length > 0 ? (
        <>
          <p className="text-sm text-muted">{t('workout.swapHint', { muscle: t(`common.muscle.${exercise.primary}`) })}</p>
          <ul className="-mx-4 m-0 list-none p-0">
            {alternatives.map((alt) => (
              <li key={alt.id}>
                <ExerciseRow exercise={alt} onClick={() => onPick(alt.id)} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-4 text-center text-base text-muted">{t('workout.swapNone')}</p>
      )}
      <Button variant="ghost" fullWidth onClick={onSearch}>
        {t('workout.swapSearch')}
      </Button>
    </div>
  )
}
