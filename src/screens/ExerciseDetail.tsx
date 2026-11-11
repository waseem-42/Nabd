import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, SearchX, Trash2, TriangleAlert, Trophy } from 'lucide-react'
import { routes } from '@/app/routes'
import { EXERCISE_BY_ID } from '@/data/catalog'
import { db, deleteCustomExercise, useDoneSessions } from '@/db'
import { fitsPlace } from '@/domain/place'
import { exerciseHistory, metricOf, personalRecords } from '@/domain/progress'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, fmtDate, fmtNumber, kgToUnit } from '@/i18n/format'
import { useWorkout } from '@/store/session'
import { useSettings } from '@/store/settings'
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, LineChart, Screen, Section, StatTile } from '@/ui'
import { ExercisePlayer } from '@/ui/ExercisePlayer'
import { ExerciseSteps } from './parts/ExerciseSteps'
import { ExerciseSafety } from './parts/ExerciseSafety'
import { useFormat, useHomeGear } from './parts/useFormat'

export default function ExerciseDetail() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const { id = '' } = useParams()
  const place = useSettings((s) => s.place)
  const gear = useHomeGear()
  const sessions = useDoneSessions()
  const active = useWorkout((s) => s.session)
  const addExercise = useWorkout((s) => s.addExercise)
  const [confirm, setConfirm] = useState(false)

  const bundled = EXERCISE_BY_ID.get(id)
  const custom = useLiveQuery(async () => (bundled ? null : ((await db.customExercises.get(id)) ?? null)), [id, bundled])
  const exercise = bundled ?? custom

  const metric = exercise ? metricOf(exercise) : 'weight'
  const records = useMemo(() => (exercise && sessions ? personalRecords(sessions, exercise.id) : null), [exercise, sessions])
  const points = useMemo(() => {
    if (!exercise || !sessions) return []
    return exerciseHistory(sessions, exercise).map((p) => ({
      label: fmtDate(p.startedAt, lang),
      value: metric === 'weight' ? Math.round(kgToUnit(p.value, fmt.unit) * 10) / 10 : p.value,
    }))
  }, [exercise, sessions, lang, metric, fmt.unit])

  if (exercise === undefined) return null
  if (exercise === null) {
    return (
      <Screen title={t('common.unknownExercise')} onBack={() => navigate(-1)}>
        <EmptyState icon={<SearchX className="size-8" />} title={t('library.notFound')} />
      </Screen>
    )
  }

  const name = pick(exercise.name, lang)
  const fits = fitsPlace(exercise, place, gear)
  const inSession = active?.entries.some((e) => e.exerciseId === exercise.id)
  const formatValue = (n: number) =>
    metric === 'sec' ? fmtClock(n) : metric === 'weight' ? fmtNumber(n, lang, 1) : fmtNumber(n, lang)

  return (
    <Screen
      title={name}
      onBack={() => navigate(-1)}
      actions={
        exercise.custom ? (
          <IconButton label={t('common.delete')} icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)} />
        ) : undefined
      }
      footer={
        active && !inSession ? (
          <Button
            size="lg"
            fullWidth
            icon={<Plus className="size-6" />}
            onClick={async () => {
              await addExercise(exercise.id)
              navigate(routes.workout)
            }}
          >
            {t('library.addToWorkout')}
          </Button>
        ) : undefined
      }
    >
      <div className="px-5 py-2">
        <ExercisePlayer slug={exercise.art} name={name} activity={exercise.id} />
        {exercise.art === 'bodyweight-squat' && <button type="button" onClick={() => navigate(routes.motionLab)} className="mt-3 min-h-12 w-full rounded-control border border-accent/25 bg-accent-soft px-4 py-3 text-start text-sm font-semibold text-accent">{t('motion.compare')} ←</button>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge tone="accent">{t(`common.muscle.${exercise.primary}`)}</Badge>
          {exercise.secondary.map((m) => (
            <Badge key={m}>{t(`common.muscle.${m}`)}</Badge>
          ))}
          <Badge>{t(`common.equipment.${exercise.equipment}`)}</Badge>
          {exercise.needs.map((a) => (
            <Badge key={a}>{t(`common.accessory.${a}`)}</Badge>
          ))}
          <Badge>{t(`common.level.${exercise.level}`)}</Badge>
          {exercise.custom && <Badge tone="ok">{t('library.custom')}</Badge>}
        </div>
        {!fits && (
          <p className="mt-3 flex items-start gap-2 text-sm text-warn">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            {t('library.notFit', { place: t(`common.place.${place}`) })}
          </p>
        )}
      </div>

      <div className="px-5 py-3"><ExerciseSafety exercise={exercise} /></div>

      {records && (
        <Section title={t('library.records')}>
          <div className="grid grid-cols-2 gap-3">
            {metric === 'weight' && (
              <>
                <StatTile
                  value={records.e1rm !== null ? fmt.weight(records.e1rm) : '—'}
                  unit={fmt.unitLabel}
                  label={t('library.e1rm')}
                  icon={<Trophy className="size-4" />}
                  tone="accent"
                />
                <StatTile value={fmt.weight(records.weight)} unit={fmt.unitLabel} label={t('library.heaviest')} />
              </>
            )}
            {metric === 'reps' && (
              <>
                <StatTile value={fmt.number(records.reps)} label={t('library.mostReps')} icon={<Trophy className="size-4" />} tone="accent" />
                {records.weight > 0 && <StatTile value={fmt.weight(records.weight)} unit={fmt.unitLabel} label={t('library.heaviest')} />}
              </>
            )}
            {metric === 'sec' && (
              <StatTile value={fmtClock(records.sec)} label={t('library.longest')} icon={<Trophy className="size-4" />} tone="accent" />
            )}
          </div>
        </Section>
      )}

      {records && (
        <Section title={t(`library.chart.${metric}`)}>
          <LineChart points={points} label={`${name}: ${t(`library.chart.${metric}`)}`} formatValue={formatValue} />
        </Section>
      )}

      <Section title={t('library.steps')}>
        <Card><ExerciseSteps exercise={exercise} /></Card>
      </Section>

      <ConfirmDialog
        open={confirm}
        title={t('library.deleteTitle')}
        message={t('library.deleteBody')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          setConfirm(false)
          await deleteCustomExercise(exercise.id)
          navigate(-1)
        }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  )
}
