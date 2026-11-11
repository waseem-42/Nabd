import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpLeft, CalendarDays, Clock, Flame, Play, TriangleAlert, Zap } from 'lucide-react'
import { routes } from '@/app/routes'
import { useNow } from '@/app/useNow'
import { useActiveProgram, useAllExercises, useDoneSessions } from '@/db'
import { routineFit } from '@/domain/place'
import { routineMinutes, sessionDurationSec, weekStreak, weekSummary } from '@/domain/progress'
import { nextRoutine } from '@/domain/session'
import { useLang, useT } from '@/i18n'
import { fmtClock, fmtDate, isoDay } from '@/i18n/format'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import { MUSCLE_TO_GROUP, type MuscleGroup, type Routine } from '@/types'
import { Badge, Button, Card, ListRow, MuscleGroupIcon, PlaceToggle, ProgressRing, Screen, Section, WeekDots } from '@/ui'
import { useFormat, useHomeGear } from './parts/useFormat'
import { useStartWorkout } from './parts/useStartWorkout'
import { ReadinessCard } from './parts/ReadinessCard'

export default function Today() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const place = useSettings((s) => s.place)
  const setSettings = useSettings((s) => s.set)
  const restSec = useSettings((s) => s.restSec)
  const gear = useHomeGear()
  const active = useWorkout((s) => s.session)
  const active$ = useActiveProgram()
  const sessions = useDoneSessions()
  const { byId } = useAllExercises()
  const startWorkout = useStartWorkout()
  const [starting, setStarting] = useState(false)
  const now = useNow(1000, !!active)

  const next = useMemo(
    () => (active$ && sessions ? nextRoutine(active$.program, active$.routines, sessions) : null),
    [active$, sessions],
  )
  const fit = useMemo(() => (next ? routineFit(next, place, gear, byId) : null), [next, place, gear, byId])
  const week = useMemo(() => weekSummary(sessions ?? []), [sessions])
  const streak = useMemo(() => weekStreak(sessions ?? []), [sessions])
  const last = sessions?.[0]
  // A rotation of N days means N workouts a week; without a program, three is a fair goal.
  const goal = Math.min(7, Math.max(1, active$?.routines.length || 3))
  const preview = useMemo(() => {
    if (!next) return null
    const groups: MuscleGroup[] = []
    for (const item of next.items) {
      const exercise = byId(item.exerciseId)
      if (exercise && !groups.includes(MUSCLE_TO_GROUP[exercise.primary])) groups.push(MUSCLE_TO_GROUP[exercise.primary])
    }
    return { groups: groups.slice(0, 4), minutes: routineMinutes(next.items, restSec), items: next.items.slice(0, 4), more: Math.max(0, next.items.length - 4) }
  }, [next, byId, restSec])

  async function start(routine?: Routine) {
    setStarting(true)
    try {
      await startWorkout(routine ? { routine, programId: active$?.program.id } : undefined)
    } finally {
      setStarting(false)
    }
  }

  return (
    <Screen title={t('brand.today')} subtitle={fmtDate(now, lang, 'long')}>
      <div className="px-5 pt-2 pb-3">
        <PlaceToggle value={place} onChange={(p) => setSettings({ place: p })} />
      </div>

      <div className="flex flex-col gap-4 px-5 py-3">
        {active ? (
          <Card tone="accent" className="hero-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent">
              <span className="size-2 animate-pulse rounded-full bg-accent" aria-hidden />
              {t('today.inProgress')}
            </div>
            <p className="mt-2 truncate text-2xl font-bold text-text">{fmt.sessionName(active)}</p>
            <p className="mt-1 text-base text-muted tabular-nums">
              {fmtClock(sessionDurationSec(active, now))} · {t('today.exerciseCount', { n: active.entries.length })}
            </p>
            <Button size="lg" fullWidth className="mt-5" icon={<Play className="size-6" />} onClick={() => navigate(routes.workout)}>
              {t('today.resume')}
            </Button>
          </Card>
        ) : active$ === undefined ? (
          <Card className="h-56 animate-pulse" aria-busy />
        ) : active$ && next ? (
          <Card className="hero-card">
            <p className="text-sm font-semibold text-accent">{t('today.next')}</p>
            <p className="mt-1 truncate text-2xl font-bold text-text">{next.name}</p>
            <p className="mt-1 truncate text-base text-muted">
              {active$.program.name} · {t('today.exerciseCount', { n: next.items.length })}
            </p>
            {preview && (
              <>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge icon={<Clock className="size-3.5" />}>{t('today.aboutMinutes', { n: fmt.number(preview.minutes) })}</Badge>
                  {preview.groups.map((g) => (
                    <Badge key={g} icon={<MuscleGroupIcon group={g} className="h-4" />}>{t(`common.group.${g}`)}</Badge>
                  ))}
                </div>
                <ul className="m-0 mt-4 flex list-none flex-col gap-2 border-t border-line p-0 pt-4">
                  {preview.items.map((item, i) => (
                    <li key={`${item.exerciseId}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-text">{fmt.exerciseName(item.exerciseId)}</span>
                      <span className="shrink-0 tabular-nums text-muted" dir="ltr">
                        {item.reps ? `${item.sets} × ${item.reps}` : `${item.sets} ×`}
                      </span>
                    </li>
                  ))}
                  {preview.more > 0 && <li className="text-sm text-faint">{t('today.andMore', { n: fmt.number(preview.more) })}</li>}
                </ul>
              </>
            )}
            {fit && !fit.fits && (
              <p className="mt-3 flex items-start gap-2 text-sm text-warn">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {t('today.notFit', { n: fit.missing.length, place: t(`common.place.${place}`) })}
              </p>
            )}
            <Button
              size="lg"
              fullWidth
              className="mt-5"
              icon={<Play className="size-6" />}
              loading={starting}
              onClick={() => void start(next)}
            >
              {t('today.start')}
            </Button>
          </Card>
        ) : active$ ? (
          <Card>
            <p className="text-lg font-semibold text-text">{active$.program.name}</p>
            <p className="mt-1 text-base text-muted">{t('today.programEmpty')}</p>
            <Button variant="secondary" fullWidth className="mt-4" onClick={() => navigate(routes.program(active$.program.id))}>
              {t('today.addDay')}
            </Button>
          </Card>
        ) : (
          <Card className="hero-card">
            <p className="text-xs font-semibold text-accent">{t('today.noProgram')}</p>
            <h2 className="mt-3 max-w-72 text-[1.75rem] font-bold leading-snug text-text">{t('brand.promise')}</h2>
            <p className="mt-1 text-base text-muted">{t('today.noProgramBody')}</p>
            <Button fullWidth className="mt-4" icon={<CalendarDays className="size-5" />} onClick={() => navigate(routes.programs)}>
              {t('today.choose')}
            </Button>
          </Card>
        )}

        {!active && (
          <Button variant="secondary" fullWidth icon={<Zap className="size-5" />} disabled={starting} onClick={() => void start()}>
            {t('today.quick')}
          </Button>
        )}
      </div>

      <Section
        title={t('today.week')}
        action={
          streak > 0 ? (
            <Badge tone="accent" icon={<Flame className="size-3.5" />}>
              {t('today.streak', { n: streak })}
            </Badge>
          ) : undefined
        }
      >
        <Card>
          <div className="mb-5 flex items-center gap-4 border-b border-line pb-4">
            <ProgressRing progress={week.count / goal} size={76} stroke={8} tone={week.count >= goal ? 'ok' : 'accent'} label={t('today.goalLabel', { done: week.count, goal })}>
              <span className="text-xl font-bold tabular-nums text-text" dir="ltr">{fmt.number(week.count)}/{fmt.number(goal)}</span>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-text">
                {week.count >= goal ? t('today.goalDone') : t('today.goalLeft', { n: fmt.number(goal - week.count) })}
              </p>
              <p className="mt-0.5 text-sm text-muted">{t(active$?.routines.length ? 'today.goalOf' : 'today.goalDefault', { goal: fmt.number(goal) })}</p>
            </div>
            <button type="button" aria-label={t('common.tab.progress')} onClick={() => navigate(routes.progress)} className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-muted hover:text-accent"><ArrowUpLeft className="size-5 ltr:-scale-x-100" /></button>
          </div>
          <WeekDots today={isoDay(now)} trainedDays={week.days.filter((d) => d.trained).map((d) => d.day)} />
          <p className="mt-4 border-t border-line pt-4 text-center text-xs text-faint">{t('brand.weekHint')}</p>
        </Card>
      </Section>

      {sessions && sessions.length > 0 && <ReadinessCard sessions={sessions} lookup={byId} now={now} />}

      {active$ && active$.routines.length > 1 && !active && (
        <Section
          title={t('today.days')}
          action={
            <Button variant="ghost" className="min-h-9 px-3 text-sm" onClick={() => navigate(routes.program(active$.program.id))}>
              {t('common.edit')}
            </Button>
          }
        >
          <Card padded={false} className="py-1">
            {active$.routines.map((r) => (
              <ListRow
                key={r.id}
                title={r.name}
                subtitle={t('today.exerciseCount', { n: r.items.length })}
                trailing={r.id === next?.id ? <Badge tone="accent">{t('today.nextBadge')}</Badge> : <Play className="size-5" />}
                onClick={() => void start(r)}
                disabled={starting}
              />
            ))}
          </Card>
        </Section>
      )}

      {last && (
        <Section title={t('today.last')}>
          <Card padded={false} className="py-1">
            <ListRow
              title={fmt.sessionName(last)}
              subtitle={`${fmtDate(last.startedAt, lang)} · ${fmtClock(sessionDurationSec(last))}`}
              chevron
              onClick={() => navigate(routes.session(last.id))}
            />
          </Card>
        </Section>
      )}
    </Screen>
  )
}
