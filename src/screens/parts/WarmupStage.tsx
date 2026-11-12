import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Flame, Pause, Play, RotateCcw } from 'lucide-react'
import { beep, vibrate } from '@/app/feedback'
import { useNow } from '@/app/useNow'
import { prefersLowImpact, warmupMinutes, warmupRoutine, type WarmupItem } from '@/domain/loading'
import { useLang, useT } from '@/i18n'
import { fmtClock } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import type { Exercise, Muscle, WorkoutSession } from '@/types'
import { Button, cx } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { useBodyProfile, useFormat } from './useFormat'

const key = (id: string) => `nabd-warmup:${id}`
/** Whether this session's warm-up was finished or skipped (kept per session, on this device). */
export function warmupDone(sessionId: string): boolean {
  try {
    return localStorage.getItem(key(sessionId)) === '1'
  } catch {
    return false
  }
}
function markWarmupDone(sessionId: string) {
  try {
    localStorage.setItem(key(sessionId), '1')
  } catch {
    /* private mode: closing it for this visit is enough */
  }
}

/** Every warm-up move is animated: two reuse the exercise rigs, the rest have warm-up rigs. */
const MOVE_RIG: Record<WarmupItem['move'], string> = {
  march: 'warmup:march', jog: 'warmup:jog', armCircles: 'warmup:armCircles', scapPushup: 'warmup:scapPushup',
  bandPullApart: 'warmup:bandPullApart', legSwings: 'warmup:legSwings', hipOpener: 'warmup:hipOpener', catCow: 'warmup:catCow',
  bwSquat: '6YUfHPL', deadBug: 'dead-bug',
}
const PER_SIDE = new Set<WarmupItem['move']>(['legSwings', 'hipOpener'])

export function useWarmupItems(session: WorkoutSession, lookup: (id: string) => Exercise | undefined) {
  const profile = useBodyProfile()
  return useMemo(() => {
    const exercises = session.entries.map((e) => lookup(e.exerciseId)).filter((e): e is Exercise => !!e)
    const muscles: Muscle[] = exercises.flatMap((e) => [e.primary, ...e.secondary])
    const heavy = exercises.some((e) => e.equipment === 'barbell')
    const items = warmupRoutine(muscles, profile, heavy)
    return { items, minutes: warmupMinutes(items), lowImpact: prefersLowImpact(profile) }
  }, [session.entries, lookup, profile])
}

/**
 * The warm-up as the first step of the workout: one move at a time with how to do it, a
 * countdown for timed moves, then straight into the first exercise.
 */
export function WarmupStage({ session, lookup, onDone }: { session: WorkoutSession; lookup: (id: string) => Exercise | undefined; onDone: () => void }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const { items, minutes, lowImpact } = useWarmupItems(session, lookup)
  const [step, setStep] = useState(0)
  const item = items[Math.min(step, items.length - 1)]
  const last = step >= items.length - 1
  const Forward = lang === 'ar' ? ChevronLeft : ChevronRight
  const Back = lang === 'ar' ? ChevronRight : ChevronLeft

  function finish() {
    markWarmupDone(session.id)
    onDone()
  }
  function next() {
    if (last) finish()
    else setStep((s) => s + 1)
  }

  if (!item) return null
  const rig = MOVE_RIG[item.move]
  const how = t(`body.how.${item.move}`).split('|')
  const amount = item.reps
    ? PER_SIDE.has(item.move) ? t('body.perSide', { n: fmt.number(item.amount) }) : t('body.repsCount', { n: fmt.number(item.amount) })
    : fmtClock(item.amount)

  return (
    <section className="overflow-hidden rounded-card border border-warn/30 bg-surface" aria-label={t('body.warmupTitle')}>
      <div className="flex items-center gap-3 border-b border-line bg-warn-soft px-4 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-warn/15 text-warn"><Flame className="size-5" aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold">{t('body.warmupTitle')}</p>
          <p className="text-xs text-muted">{t('body.warmupMeta', { n: fmt.number(minutes) })}{lowImpact ? ` · ${t('body.warmupLowImpact')}` : ''}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-bg/70 px-3 py-1 text-xs font-semibold tabular-nums">{t('app.w.of', { n: fmt.number(step + 1), total: fmt.number(items.length) })}</span>
      </div>

      <div className="flex gap-1.5 px-4 pt-3" aria-hidden>
        {items.map((_, i) => (
          <span key={i} className={cx('h-1.5 flex-1 rounded-pill transition-colors', i < step ? 'bg-ok' : i === step ? 'bg-warn' : 'bg-line')} />
        ))}
      </div>

      <div className="px-4 pt-3">
        <MotionThumb key={rig} exerciseId={rig} name={t(`body.move.${item.move}`)} className="aspect-[4/3] w-full rounded-control" />
      </div>

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-xl font-bold leading-snug">{t(`body.move.${item.move}`)}</h1>
          {item.reps && <span className="shrink-0 rounded-pill bg-warn-soft px-3 py-1 text-base font-bold text-warn tabular-nums">{amount}</span>}
        </div>
        {!item.reps && <MoveTimer key={`${step}-${item.move}`} seconds={item.amount} onEnd={next} />}

        <p className="mt-4 mb-2 text-sm font-semibold text-muted">{t('body.howTo')}</p>
        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {how.map((line, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-warn-soft text-sm font-bold text-warn tabular-nums">{fmt.number(i + 1)}</span>
              <p className="m-0 pt-0.5 text-base leading-relaxed">{line}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-2 px-4 pt-5 pb-4">
        <Button fullWidth size="lg" icon={last ? <Check className="size-6" /> : <Forward className="size-6" />} onClick={next}>
          {last ? t('body.warmupStart') : t('body.warmupNext')}
        </Button>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="md" icon={<Back className="size-5" />} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>{t('app.w.prev')}</Button>
          <Button variant="ghost" size="md" onClick={finish}>{t('body.warmupSkip')}</Button>
        </div>
      </div>
    </section>
  )
}

/** A big countdown for timed warm-up moves; cues at zero and moves on. */
function MoveTimer({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const t = useT()
  const sound = useSettings((s) => s.sound)
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [pausedLeft, setPausedLeft] = useState(seconds)
  const now = useNow(250, endsAt !== null)
  const left = endsAt === null ? pausedLeft : Math.max(0, Math.ceil((endsAt - now) / 1000))

  useEffect(() => {
    if (endsAt === null || left > 0) return
    setEndsAt(null)
    setPausedLeft(seconds)
    if (sound) beep()
    vibrate([180, 90, 180])
    onEnd()
  }, [endsAt, left, seconds, sound, onEnd])

  const running = endsAt !== null
  return (
    <div className="mt-3 flex items-center gap-3 rounded-control border border-line bg-bg p-3">
      <p className="min-w-0 flex-1 text-4xl font-bold tabular-nums" dir="ltr">{fmtClock(left)}</p>
      {left < seconds && !running && (
        <button type="button" onClick={() => setPausedLeft(seconds)} aria-label={t('body.timerReset')} className="flex size-11 items-center justify-center rounded-full text-muted">
          <RotateCcw className="size-5" aria-hidden />
        </button>
      )}
      <Button
        variant={running ? 'secondary' : 'primary'}
        icon={running ? <Pause className="size-5" /> : <Play className="size-5" />}
        onClick={() => {
          if (running) { setPausedLeft(left); setEndsAt(null) }
          else setEndsAt(Date.now() + left * 1000)
        }}
      >
        {running ? t('body.timerPause') : t('body.timerStart')}
      </Button>
    </div>
  )
}
