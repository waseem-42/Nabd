import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarCheck, ChartNoAxesColumn, Flame, Plus, Scale, Weight } from 'lucide-react'
import { routes } from '@/app/routes'
import { upsertBodyWeight, useAllExercises, useBodyWeights, useDoneSessions } from '@/db'
import { sessionDurationSec, totals, weekStreak, weekSummary, workSets } from '@/domain/progress'
import { useLang, useT } from '@/i18n'
import { fmtClock, fmtDate, fmtNumber, isoDay, kgToUnit, unitToKg } from '@/i18n/format'
import type { Exercise } from '@/types'
import { Button, Card, EmptyState, ExerciseRow, LineChart, ListRow, Screen, Section, Sheet, StatTile, Stepper } from '@/ui'
import { MuscleSplit, RecentRecords, WeeklyTrend, weightChange } from './parts/ProgressTrends'
import { useFormat } from './parts/useFormat'

const HISTORY_PAGE = 20

export default function Progress() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const sessions = useDoneSessions()
  const weights = useBodyWeights()
  const { byId } = useAllExercises()
  const [logOpen, setLogOpen] = useState(false)
  const [shown, setShown] = useState(HISTORY_PAGE)

  const all = useMemo(() => totals(sessions ?? []), [sessions])
  const streak = useMemo(() => weekStreak(sessions ?? []), [sessions])
  const week = useMemo(() => weekSummary(sessions ?? []), [sessions])

  /** Most-trained exercises first: the ones worth a progress chart. */
  const trained = useMemo(() => {
    const count = new Map<string, number>()
    for (const s of sessions ?? []) {
      for (const id of new Set(s.entries.filter((e) => workSets(e).length).map((e) => e.exerciseId))) {
        count.set(id, (count.get(id) ?? 0) + 1)
      }
    }
    return [...count.entries()]
      .map(([id, n]) => ({ exercise: byId(id), n }))
      .filter((x): x is { exercise: Exercise; n: number } => !!x.exercise)
      .sort((a, b) => b.n - a.n)
      .slice(0, 8)
  }, [sessions, byId])

  const weightPoints = useMemo(
    () =>
      (weights ?? []).map((w) => ({
        label: fmtDate(new Date(`${w.day}T12:00:00`), lang),
        value: Math.round(kgToUnit(w.kg, fmt.unit) * 10) / 10,
      })),
    [weights, lang, fmt.unit],
  )
  const latestKg = weights?.at(-1)?.kg
  const change = weightChange(weights ?? [], fmt.unit)
  // Stable for the day so the trend memos don't recompute on every render.
  const now = useMemo(() => new Date().setHours(23, 59, 59, 0), [])

  if (sessions === undefined) return <Screen title={t('common.tab.progress')}>{null}</Screen>

  return (
    <Screen title={t('common.tab.progress')}>
      <div className="grid grid-cols-2 gap-3 px-5 py-3">
        <StatTile value={fmt.number(all.sessions)} label={t('progress.workouts')} icon={<CalendarCheck className="size-4" />} tone="accent" />
        <StatTile value={fmt.number(streak)} label={t('progress.streakWeeks')} icon={<Flame className="size-4" />} />
        <StatTile value={fmt.number(week.count)} label={t('progress.thisWeek')} icon={<ChartNoAxesColumn className="size-4" />} />
        <StatTile
          value={fmtNumber(kgToUnit(all.volume, fmt.unit) / 1000, lang, 1)}
          unit={t('progress.thousand', { unit: fmt.unitLabel })}
          label={t('progress.totalVolume')}
          icon={<Weight className="size-4" />}
        />
      </div>

      {sessions.length > 0 && <WeeklyTrend sessions={sessions} now={now} />}
      <RecentRecords sessions={sessions} />
      <MuscleSplit sessions={sessions} lookup={byId} now={now} />

      <Section
        title={t('progress.bodyWeight')}
        action={
          <Button variant="ghost" className="min-h-9 px-3 text-sm text-accent" icon={<Plus className="size-4" />} onClick={() => setLogOpen(true)}>
            {t('progress.logWeight')}
          </Button>
        }
      >
        <Card>
          {latestKg !== undefined && (
            <p className="mb-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-text tabular-nums">{fmt.weight(latestKg)}</span>
              <span className="text-base text-muted">{fmt.unitLabel}</span>
              {change !== null && change !== 0 && (
                <span className="ms-auto text-sm text-muted">
                  <span dir="ltr" className="tabular-nums">{change > 0 ? '+' : '−'}{fmtNumber(Math.abs(change), lang, 1)}</span> {fmt.unitLabel} · {t('progress.in30Days')}
                </span>
              )}
            </p>
          )}
          <LineChart
            points={weightPoints}
            label={t('progress.bodyWeight')}
            formatValue={(n) => fmtNumber(n, lang, 1)}
            emptyLabel={t('progress.weightEmpty')}
          />
        </Card>
      </Section>

      {trained.length > 0 && (
        <Section title={t('progress.byExercise')}>
          <Card padded={false} className="py-1">
            {trained.map(({ exercise, n }) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onClick={() => navigate(routes.exercise(exercise.id))}
                trailing={<span className="shrink-0 text-sm text-muted tabular-nums">×{fmt.number(n)}</span>}
              />
            ))}
          </Card>
        </Section>
      )}

      <Section title={t('progress.history')}>
        {sessions.length === 0 ? (
          <EmptyState icon={<ChartNoAxesColumn className="size-8" />} title={t('progress.emptyTitle')} body={t('progress.emptyBody')} />
        ) : (
          <>
            <Card padded={false} className="py-1">
              {sessions.slice(0, shown).map((s) => (
                <ListRow
                  key={s.id}
                  title={fmt.sessionName(s)}
                  subtitle={`${fmtDate(s.startedAt, lang)} · ${fmtClock(sessionDurationSec(s))} · ${t(`common.place.${s.place}`)}`}
                  chevron
                  onClick={() => navigate(routes.session(s.id))}
                />
              ))}
            </Card>
            {sessions.length > shown && (
              <Button variant="ghost" fullWidth className="mt-2" onClick={() => setShown(shown + HISTORY_PAGE)}>
                {t('progress.showMore')}
              </Button>
            )}
          </>
        )}
      </Section>

      <WeightSheet open={logOpen} onClose={() => setLogOpen(false)} initialKg={latestKg ?? 70} />
    </Screen>
  )
}

function WeightSheet({ open, onClose, initialKg }: { open: boolean; onClose: () => void; initialKg: number }) {
  const t = useT()
  const fmt = useFormat()
  const [value, setValue] = useState<number | null>(null)
  const shown = value ?? Math.round(kgToUnit(initialKg, fmt.unit) * 10) / 10

  function close() {
    setValue(null)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t('progress.logWeight')}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Scale className="size-5" />}
          onClick={async () => {
            await upsertBodyWeight(isoDay(), Math.round(unitToKg(shown, fmt.unit) * 100) / 100)
            close()
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <p className="mb-4 text-base text-muted">{t('progress.weightHint')}</p>
      <Stepper
        label={t('progress.bodyWeight')}
        value={shown}
        onChange={setValue}
        step={fmt.unit === 'kg' ? 0.1 : 0.2}
        decimals={1}
        min={20}
        max={700}
        unit={fmt.unitLabel}
      />
    </Sheet>
  )
}
