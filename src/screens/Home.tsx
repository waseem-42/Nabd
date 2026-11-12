import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Feather, Play, Repeat, RotateCw, Share, Smartphone, Trophy, Zap } from 'lucide-react'
import { routes } from '@/app/routes'
import { useNow } from '@/app/useNow'
import { dismissInstall, promptInstall, useInstall } from '@/app/install'
import { restartProgram, startProgramFromTemplate, useActiveProgram, useAllExercises, useDoneSessions } from '@/db'
import { muscleReadiness } from '@/domain/recovery'
import { PROGRAM_TEMPLATES, PROGRAM_TEMPLATE_BY_ID } from '@/data/catalog'
import { routineMinutes, weekSummary } from '@/domain/progress'
import { nextRoutine, planPosition, type PlanPosition } from '@/domain/session'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, isoDay } from '@/i18n/format'
import { sessionDurationSec } from '@/domain/progress'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import type { ProgramTemplate, RoutineItem, UserProgram, WorkoutSession } from '@/types'
import { Button, MuscleGroupIcon, WeekDots, cx } from '@/ui'
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
  const position = useMemo(() => {
    if (!plan || !sessions) return null
    // Programs started before blocks existed take the length from their template.
    const weeks = plan.program.weeks ?? (plan.program.templateId ? PROGRAM_TEMPLATE_BY_ID.get(plan.program.templateId)?.weeks : undefined) ?? null
    return planPosition(plan.program, plan.routines, sessions, now, weeks)
  }, [plan, sessions, now])
  const placeSessions = useMemo(() => (sessions ?? []).filter((s) => s.place === place), [sessions, place])
  const week = useMemo(() => weekSummary(placeSessions, now), [placeSessions, now])
  const trainingDays = useSettings((s) => s.trainingDays)
  const goal = Math.min(7, Math.max(1, trainingDays.length || plan?.routines.length || 3))
  const trainedToday = week.days.some((d) => d.day === isoDay(now) && d.trained)

  async function start() {
    if (!next || !plan) return
    setStarting(true)
    try {
      await startWorkout({ routine: next, programId: plan.program.id, deload: !!position?.deload })
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

      {plan === undefined ? null : plan && position?.finished && !active ? (
        <ProgramDone program={plan.program} position={position} />
      ) : plan && next ? (
        <section className="overflow-hidden rounded-card border border-line bg-surface" aria-labelledby="today-title">
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div className="min-w-0">
              <p className="truncate text-sm text-muted">{t('app.today')} · {fmt.planName(plan.program.name)}</p>
              <h1 id="today-title" className="truncate text-2xl font-bold">{fmt.planName(next.name)}</h1>
              <p className="mt-1 text-sm text-muted">
                {t('app.exerciseCount', { n: fmt.number(next.items.length) })} · {t('app.minutes', { n: fmt.number(routineMinutes(next.items, restSec)) })}
              </p>
              {position && (
                <p className="mt-1 text-sm font-semibold text-accent">
                  {t('app.dayOf', { n: fmt.number(position.day), total: fmt.number(position.total) })} ·{' '}
                  {position.weeks ? t('app.weekOf', { week: fmt.number(position.week), weeks: fmt.number(position.weeks) }) : t('app.weekN', { week: fmt.number(position.week) })}
                </p>
              )}
            </div>
            <Link to={routes.programs} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border border-line px-3 text-xs font-semibold text-muted">
              <RotateCw className="size-3.5" aria-hidden />{t('app.changePlan')}
            </Link>
          </div>
          {position?.deload && (
            <p className="mx-5 mt-3 flex items-start gap-2 rounded-control bg-ok-soft px-3 py-2 text-sm text-ok">
              <Feather className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span><span className="font-bold">{t('app.deload')}: </span>{t('app.deloadHint')}</span>
            </p>
          )}
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
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">{t('app.week', { n: fmt.number(week.count), goal: fmt.number(goal) })}</p>
            {trainingDays.length > 0 && !trainedToday && (
              <p className={cx('text-xs font-semibold', trainingDays.includes(new Date(now).getDay()) ? 'text-accent' : 'text-faint')}>
                {t(trainingDays.includes(new Date(now).getDay()) ? 'app.days.today' : 'app.days.rest')}
              </p>
            )}
          </div>
          <WeekDots today={isoDay(now)} trainedDays={week.days.filter((d) => d.trained).map((d) => d.day)} />
        </div>
      </section>

      {sessions && sessions.length > 0 && !active && <InstallCard />}

      {sessions && <Readiness sessions={sessions} now={now} />}

      {!active && (
        <button type="button" onClick={() => void startWorkout()} className="flex min-h-12 items-center justify-center gap-2 rounded-control text-sm font-semibold text-muted">
          <Zap className="size-4" aria-hidden />{t('app.free')}
        </button>
      )}
    </div>
  )
}

/** After the first finished workout: offer to put the app on the home screen. */
function InstallCard() {
  const t = useT()
  const mode = useInstall()
  if (!mode) return null
  return (
    <section className="flex items-start gap-3 rounded-card border border-line bg-surface p-4" aria-labelledby="install-title">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent"><Smartphone className="size-5" aria-hidden /></span>
      <div className="min-w-0 flex-1">
        <h2 id="install-title" className="font-bold">{t('app.install.title')}</h2>
        <p className="mt-0.5 text-sm text-muted">
          {mode === 'ios' ? <><Share className="me-1 inline size-4 align-text-bottom" aria-hidden />{t('app.install.ios')}</> : t('app.install.body')}
        </p>
        <div className="mt-3 flex gap-2">
          {mode === 'prompt' && <Button size="md" onClick={() => void promptInstall()}>{t('app.install.action')}</Button>}
          <Button size="md" variant="ghost" onClick={dismissInstall}>{t('app.install.later')}</Button>
        </div>
      </div>
    </section>
  )
}

/** The block is over: repeat it, or move up to the next program. */
function ProgramDone({ program, position }: { program: UserProgram; position: PlanPosition }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const [busy, setBusy] = useState<'repeat' | 'next' | null>(null)
  const template = program.templateId ? PROGRAM_TEMPLATE_BY_ID.get(program.templateId) : undefined
  const next = template?.next ? PROGRAM_TEMPLATE_BY_ID.get(template.next) : undefined
  const records = position.sessions.reduce((n, s) => n + (s.prs?.length ?? 0), 0)

  async function run(kind: 'repeat' | 'next') {
    setBusy(kind)
    try {
      if (kind === 'next' && next) await startProgramFromTemplate(next.id, lang)
      else await restartProgram(program.id)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="rounded-card border border-accent/40 bg-accent-soft p-5" aria-labelledby="done-title">
      <Trophy className="mb-2 size-9 text-accent" aria-hidden />
      <h1 id="done-title" className="text-2xl font-bold">{t('app.done.title', { name: fmt.planName(program.name) })}</h1>
      <p className="mt-1 text-muted">
        {t('app.done.body', { n: fmt.number(position.sessions.length), weeks: fmt.number(position.weeks ?? 0) })}
        {records > 0 && ` ${t('app.done.records', { n: fmt.number(records) })}`}
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {next && (
          <div>
            <Button fullWidth size="lg" icon={<ArrowUpRight className="size-5" />} loading={busy === 'next'} onClick={() => void run('next')}>
              {t('app.done.next', { name: pick(next.name, lang) })}
            </Button>
            <p className="mt-1.5 text-center text-xs text-muted">{t('app.done.nextHint', { desc: pick(next.description, lang) })}</p>
          </div>
        )}
        <div>
          <Button fullWidth size="lg" variant={next ? 'secondary' : 'primary'} icon={<Repeat className="size-5" />} loading={busy === 'repeat'} onClick={() => void run('repeat')}>
            {t('app.done.repeat')}
          </Button>
          <p className="mt-1.5 text-center text-xs text-muted">{t('app.done.repeatHint')}</p>
        </div>
      </div>
    </section>
  )
}

/** How rested each muscle group is, from when it last did work sets. Hidden until something was trained in the last 3 days. */
function Readiness({ sessions, now }: { sessions: WorkoutSession[]; now: number }) {
  const t = useT()
  const { byId } = useAllExercises()
  // Recomputed once a minute is plenty; `now` ticks every second only during a workout.
  const minute = Math.floor(now / 60_000)
  const groups = useMemo(() => muscleReadiness(sessions, byId, minute * 60_000), [sessions, byId, minute])
  if (!groups.some((g) => g.value < 1)) return null
  return (
    <section className="rounded-card border border-line bg-surface px-4 py-3" aria-labelledby="ready-title">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="ready-title" className="text-sm font-semibold">{t('body.recoveryTitle')}</h2>
        <span className="text-xs text-faint">{t('app.readyHint')}</span>
      </div>
      <ul className="m-0 grid list-none grid-cols-3 gap-x-3 gap-y-3 p-0">
        {groups.map((g) => {
          const fresh = g.value >= 1
          return (
            <li key={g.group} className="flex items-center gap-2">
              <MuscleGroupIcon group={g.group} className={cx('h-7 shrink-0', fresh ? 'text-muted' : 'text-warn')} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{t(`common.group.${g.group}`)}</span>
                <span className="mt-1 block h-1 overflow-hidden rounded-pill bg-line" role="img" aria-label={t(fresh ? 'body.fresh' : 'body.recovering')}>
                  <span className={cx('block h-full rounded-pill', fresh ? 'bg-ok' : 'bg-warn')} style={{ width: `${Math.max(8, g.value * 100)}%` }} />
                </span>
              </span>
            </li>
          )
        })}
      </ul>
    </section>
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
            {t('app.daysPerWeek', { n: fmt.number(template.daysPerWeek) })} · {t(`app.level.${template.level}`)}
          </p>
        </div>
        <Button size="md" loading={busy} onClick={onFollow}>{t('app.follow')}</Button>
      </div>
    </article>
  )
}
