import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Dumbbell, Plus, Trash2, TriangleAlert, X } from 'lucide-react'
import {
  createRoutine,
  deleteRoutine,
  getProgram,
  getRoutine,
  updateProgram,
  updateRoutine,
  useAllExercises,
} from '@/db'
import { filterForPlace, fitsPlace } from '@/domain/place'
import { DEFAULT_SET_COUNT } from '@/domain/session'
import { pick, useLang, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { Exercise, Place, RoutineItem } from '@/types'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ExerciseArt,
  ExercisePickerSheet,
  IconButton,
  PlaceToggle,
  Screen,
  Section,
  Stepper,
  TextField,
  useToast,
} from '@/ui'
import { useHomeGear } from './parts/useFormat'

interface Draft {
  name: string
  place: Place
  items: RoutineItem[]
}

/** Default targets for a newly added exercise, by how it is measured. */
function newItem(exercise: Exercise): RoutineItem {
  if (exercise.mode === 'time') return { exerciseId: exercise.id, sets: DEFAULT_SET_COUNT, sec: 30 }
  if (exercise.mode === 'cardio') return { exerciseId: exercise.id, sets: 1, sec: 1200 }
  return { exerciseId: exercise.id, sets: DEFAULT_SET_COUNT, reps: 10 }
}

/** `/routine/:id` edits one training day; `/routine/new?program=<id>` creates one and appends it to the program. */
export default function RoutineEdit() {
  const t = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const { id = 'new' } = useParams()
  const [params] = useSearchParams()
  const programId = params.get('program')
  const isNew = id === 'new'
  const defaultPlace = useSettings((s) => s.place)
  const gear = useHomeGear()
  const { exercises, byId } = useAllExercises()

  const [draft, setDraft] = useState<Draft | null>(isNew ? { name: '', place: defaultPlace, items: [] } : null)
  const [missing, setMissing] = useState(false)
  const [picking, setPicking] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load once: later edits live in the draft until saved.
  useEffect(() => {
    let live = true
    if (isNew) {
      if (programId) void getProgram(programId).then((p) => live && p && setDraft((d) => (d ? { ...d, place: p.place } : d)))
    } else {
      void getRoutine(id).then((r) => {
        if (!live) return
        if (r) setDraft({ name: r.name, place: r.place, items: r.items })
        else setMissing(true)
      })
    }
    return () => {
      live = false
    }
  }, [id, isNew, programId])

  const draftPlace = draft?.place ?? defaultPlace
  const placeExercises = useMemo(() => filterForPlace(exercises, draftPlace, gear), [exercises, draftPlace, gear])

  if (missing) {
    return (
      <Screen title={t('programs.editDay')} onBack={() => navigate(-1)}>
        <EmptyState title={t('programs.dayNotFound')} />
      </Screen>
    )
  }
  if (!draft) return null

  const patchItem = (i: number, patch: Partial<RoutineItem>) =>
    setDraft({ ...draft, items: draft.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
  const moveItem = (from: number, to: number) => {
    const items = [...draft.items]
    const [moved] = items.splice(from, 1)
    if (!moved) return
    items.splice(to, 0, moved)
    setDraft({ ...draft, items })
  }

  async function save() {
    if (!draft) return
    setSaving(true)
    try {
      const input = { name: draft.name.trim(), place: draft.place, items: draft.items }
      if (isNew) {
        const routine = await createRoutine(input)
        if (programId) {
          const program = await getProgram(programId)
          if (program) await updateProgram(programId, { routineIds: [...program.routineIds, routine.id] })
        }
      } else {
        await updateRoutine(id, input)
      }
      toast(t('common.saved'), { tone: 'ok' })
      navigate(-1)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen
      title={isNew ? t('programs.newDay') : t('programs.editDay')}
      onBack={() => navigate(-1)}
      actions={
        !isNew ? <IconButton label={t('programs.deleteDay')} icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)} /> : undefined
      }
      footer={
        <Button size="lg" fullWidth loading={saving} disabled={!draft.name.trim() || draft.items.length === 0} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5 px-5 py-2">
        <TextField
          label={t('programs.dayName')}
          placeholder={t('programs.dayNamePlaceholder')}
          value={draft.name}
          onChange={(name) => setDraft({ ...draft, name })}
          maxLength={60}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('common.placeLabel')}</p>
          <PlaceToggle size="md" value={draft.place} onChange={(place) => setDraft({ ...draft, place })} />
        </div>
      </div>

      <Section title={t('programs.exercises')}>
        {draft.items.length === 0 ? (
          <EmptyState icon={<Dumbbell className="size-8" />} title={t('programs.noExercises')} className="py-6" />
        ) : (
          <div className="flex flex-col gap-3">
            {draft.items.map((item, i) => (
              <ItemEditor
                key={`${i}-${item.exerciseId}`}
                item={item}
                exercise={byId(item.exerciseId)}
                fits={(() => {
                  const ex = byId(item.exerciseId)
                  return ex ? fitsPlace(ex, draft.place, gear) : false
                })()}
                first={i === 0}
                last={i === draft.items.length - 1}
                onChange={(patch) => patchItem(i, patch)}
                onMove={(dir) => moveItem(i, i + dir)}
                onRemove={() => setDraft({ ...draft, items: draft.items.filter((_, j) => j !== i) })}
              />
            ))}
          </div>
        )}
        <Button variant="secondary" fullWidth className="mt-3" icon={<Plus className="size-5" />} onClick={() => setPicking(true)}>
          {t('workout.addExercise')}
        </Button>
      </Section>

      <ExercisePickerSheet
        open={picking}
        onClose={() => setPicking(false)}
        exercises={placeExercises}
        excludeIds={draft.items.map((it) => it.exerciseId)}
        onPick={(ex) => {
          setPicking(false)
          setDraft({ ...draft, items: [...draft.items, newItem(ex)] })
        }}
      />
      <ConfirmDialog
        open={confirm}
        title={t('programs.deleteDayTitle')}
        message={t('programs.deleteDayBody')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          setConfirm(false)
          await deleteRoutine(id)
          navigate(-1)
        }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  )
}

function ItemEditor({
  item,
  exercise,
  fits,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  item: RoutineItem
  exercise: Exercise | undefined
  fits: boolean
  first: boolean
  last: boolean
  onChange: (patch: Partial<RoutineItem>) => void
  onMove: (dir: 1 | -1) => void
  onRemove: () => void
}) {
  const t = useT()
  const lang = useLang()
  const mode = exercise?.mode ?? 'reps'
  const name = exercise ? pick(exercise.name, lang) : t('common.unknownExercise')

  return (
    <Card padded={false} className="p-4">
      <div className="flex items-center gap-3">
        <ExerciseArt slug={exercise?.art ?? null} still name={name} className="size-12 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-text">{name}</p>
          {!fits && (
            <Badge tone="warn" icon={<TriangleAlert className="size-3.5" />} className="mt-1">
              {t('programs.itemNotFit')}
            </Badge>
          )}
        </div>
        <IconButton label={t('common.moveUp')} icon={<ArrowUp className="size-5" />} disabled={first} onClick={() => onMove(-1)} className="size-10" />
        <IconButton label={t('common.moveDown')} icon={<ArrowDown className="size-5" />} disabled={last} onClick={() => onMove(1)} className="size-10" />
        <IconButton label={t('workout.removeExercise')} icon={<X className="size-5" />} onClick={onRemove} className="size-10" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3">
        <div>
          <p className="mb-1 text-center text-sm text-muted">{t('programs.sets')}</p>
          <Stepper label={t('programs.sets')} value={item.sets} onChange={(sets) => onChange({ sets })} min={1} max={20} />
        </div>
        {mode === 'reps' && (
          <div>
            <p className="mb-1 text-center text-sm text-muted">{t('workout.reps')}</p>
            <Stepper label={t('workout.reps')} value={item.reps ?? 10} onChange={(reps) => onChange({ reps })} min={1} max={100} unit={t('common.reps')} />
          </div>
        )}
        {mode === 'time' && (
          <div>
            <p className="mb-1 text-center text-sm text-muted">{t('workout.seconds')}</p>
            <Stepper label={t('workout.seconds')} value={item.sec ?? 30} onChange={(sec) => onChange({ sec })} step={5} min={5} max={3600} unit={t('common.sec')} />
          </div>
        )}
        {mode === 'cardio' && (
          <div>
            <p className="mb-1 text-center text-sm text-muted">{t('workout.minutes')}</p>
            <Stepper
              label={t('workout.minutes')}
              value={Math.round((item.sec ?? 1200) / 60)}
              onChange={(min) => onChange({ sec: min * 60 })}
              min={1}
              max={600}
              unit={t('common.min')}
            />
          </div>
        )}
      </div>
    </Card>
  )
}
