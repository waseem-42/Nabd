import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play, RotateCw, Zap } from 'lucide-react'
import { routes } from '@/app/routes'
import { useNow } from '@/app/useNow'
import { startProgramFromTemplate, useActiveProgram, useAllExercises, useDoneSessions } from '@/db'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { routineMinutes, weekSummary } from '@/domain/progress'
import { nextRoutine } from '@/domain/session'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, isoDay } from '@/i18n/format'
import { sessionDurationSec } from '@/domain/progress'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import type { ProgramTemplate, RoutineItem } from '@/types'
import { Button, WeekDots, cx } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { useFormat } from './parts/useFormat'
import { useStartWorkout } from './parts/useStartWorkout'

/** Train: today's workout for the chosen place, or a plan to pick. Nothing else. */
export default function Home() {
  const t = useT()
  const fmt = useFormat()
  const place = useSettings((s) => s.place)
  const restSec = useSettings((s) => s.restSec)
  const active = useWorkout((s) => s.session)
  const plan = useActiveProgram()
  const sessions = useDoneSessions()
  const startWorkout = useStartWorkout()
  const now = useNow(1000, !!active)
  const [starting, setStarting] = useState(false)

  const next = useMemo(() => (plan && sessions ? nextRoutine(plan.program, plan.routines, sessions) : null), [plan, sessions])
  const placeSessions = useMemo(() => (sessions ?? []).filter((s) => s.place === place), [sessions, place])
  const week = useMemo(() => weekSummary(placeSessions, now), [placeSessions, now])
  const goal = Math.min(7, Math.max(1, plan?.routines.length || 3))

  async function start() {
    if (!next || !plan) return
    setStarting(true)
    try {
      await startWorkout({ routine: next, programId: plan.program.id })
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-2">
      {active && (
        <Link to={routes.workout} className="flex items-center gap-4 rounded-card border border-accent/40 bg-accent-soft p-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-ink"><Play className="size-5" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-accent">{t('app.resume')}</span>
            <span className="block truncate text-sm text-muted tabular-nums">{fmt.sessionName(active)} · {fmtClock(sessionDurationSec(active, now))}</span>
          </span>
        </Link>
      )}

      {plan === undefined ? null : plan && next ? (
        <section className="overflow-hidden rounded-card border border-line bg-surface" aria-labelledby="today-title">
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="min-w-0">
              <p className="text-sm text-muted">{t('app.today')} · {plan.program.name}</p>
              <h1 id="today-title" className="truncate text-2xl font-bold">{next.name}</h1>
              <p className="mt-1 text-sm text-muted">
                {t('app.exerciseCount', { n: fmt.number(next.items.length) })} · {t('app.minutes', { n: fmt.number(routineMinutes(next.items, restSec)) })}
              </p>
            </div>
            <Link to={routes.programs} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 text-xs font-semibold text-muted">
              <RotateCw className="size-3.5" aria-hidden />{t('app.changePlan')}
            </Link>
          </div>
          <ExerciseStrip items={next.items} />
          <div className="px-5 pb-5">
            {active ? null : (
              <Button fullWidth size="lg" icon={<Play className="size-5" />} loading={starting} onClick={() => void start()}>
                {t('app.start')}
              </Button>
            )}
          </div>
        </section>
      ) : (
        <PlanPicker />
      )}

      <section className="flex items-center gap-4 rounded-card border border-line bg-surface px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-semibold">{t('app.week', { n: fmt.number(week.count), goal: fmt.number(goal) })}</p>
          <WeekDots today={isoDay(now)} trainedDays={week.days.filter((d) => d.trained).map((d) => d.day)} />
        </div>
      </section>

      {!active && (
        <button type="button" onClick={() => void startWorkout()} className="flex min-h-12 items-center justify-center gap-2 rounded-control text-sm font-semibold text-muted">
          <Zap className="size-4" aria-hidden />{t('app.free')}
        </button>
      )}
    </div>
  )
}

/** The day's exercises as moving figures, scrolled sideways. */
function ExerciseStrip({ items }: { items: RoutineItem[] }) {
  const t = useT()
  const fmt = useFormat()
  const { byId } = useAllExercises()
  return (
    <ul className="m-0 flex list-none gap-3 overflow-x-auto px-5 py-4 [scrollbar-width:none]">
      {items.map((item, i) => {
        const exercise = byId(item.exerciseId)
        const name = fmt.exerciseName(item.exerciseId)
        return (
          <li key={`${item.exerciseId}-${i}`} className="w-28 shrink-0">
            <Link to={routes.exercise(item.exerciseId)} className="block">
              <MotionThumb exerciseId={item.exerciseId} art={exercise?.art} name={name} className="aspect-square w-full rounded-control" />
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{name}</p>
              <p className="text-xs text-muted tabular-nums">
                {item.sec !== undefined ? t('app.setsSec', { sets: item.sets, sec: item.sec }) : t('app.setsReps', { sets: item.sets, reps: item.reps ?? 10 })}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

/** Ready plans for the current place; following one makes it this place's plan. */
export function PlanPicker({ compact }: { compact?: boolean }) {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const place = useSettings((s) => s.place)
  const level = useSettings((s) => s.level)
  const [busy, setBusy] = useState<string | null>(null)
  const templates = useMemo(
    () => PROGRAM_TEMPLATES.filter((p) => p.place === place).sort((a, b) => Number(b.level === level) - Number(a.level === level)),
    [place, level],
  )
  async function follow(template: ProgramTemplate) {
    setBusy(template.id)
    try {
      await startProgramFromTemplate(template.id, lang)
      navigate(routes.today)
    } finally {
      setBusy(null)
    }
  }
  return (
    <section className="flex flex-col gap-3">
      {!compact && <h1 className="text-2xl font-bold">{t('app.pickPlan')}</h1>}
      {templates.map((template) => <PlanCard key={template.id} template={template} busy={busy === template.id} onFollow={() => void follow(template)} />)}
    </section>
  )
}

function PlanCard({ template, busy, onFollow }: { template: ProgramTemplate; busy: boolean; onFollow: () => void }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const ids = [...new Set(template.days.flatMap((d) => d.items.map((item) => item.exerciseId)))].slice(0, 4)
  return (
    <article className="rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex gap-2">
        {ids.map((id) => <MotionThumb key={id} exerciseId={id} name={fmt.exerciseName(id)} className="aspect-square flex-1 rounded-control" />)}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{pick(template.name, lang)}</h2>
          <p className="text-sm text-muted">{pick(template.description, lang)}</p>
          <p className={cx('mt-1 text-xs font-semibold', template.place === 'home' ? 'text-home' : 'text-gym')}>
            {t('app.daysPerWeek', { n: fmt.number(template.daysPerWeek) })} · {t(`app.level.${template.level === 'beginner' ? 'beginner' : 'intermediate'}`)}
          </p>
        </div>
        <Button size="md" loading={busy} onClick={onFollow}>{t('app.follow')}</Button>
      </div>
    </article>
  )
}
