import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDown, ArrowUp, Pencil, Play, Plus, SearchX, Trash2, TriangleAlert } from 'lucide-react'
import { routes } from '@/app/routes'
import { PROGRAM_TEMPLATE_BY_ID } from '@/data/catalog'
import { deleteProgram, getProgramWithRoutines, startProgramFromTemplate, updateProgram, useAllExercises } from '@/db'
import { templateFit } from '@/domain/place'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import type { Exercise, ProgramTemplate, Routine, RoutineItem, UserProgram } from '@/types'
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Screen, Section, Sheet, TextField, useToast } from '@/ui'
import { ExerciseInfoSheet } from './parts/ExerciseInfoSheet'
import { useFormat, useHomeGear } from './parts/useFormat'

/** `/programs/:id` shows a bundled template or one of the user's programs (ids never collide). */
export default function ProgramDetail() {
  const { id = '' } = useParams()
  const template = PROGRAM_TEMPLATE_BY_ID.get(id)
  if (template) return <TemplateView template={template} />
  return <UserProgramView id={id} />
}

/** "3 × 10", "3 × 0:45", "1 × 20 min". */
function useTarget() {
  const t = useT()
  const fmt = useFormat()
  return (item: RoutineItem) => {
    const mode = fmt.modeOf(item.exerciseId)
    if (mode === 'reps') return `${item.sets} × ${item.reps ?? 10}`
    if (mode === 'cardio') return `${item.sets} × ${Math.round((item.sec ?? 600) / 60)} ${t('common.min')}`
    return `${item.sets} × ${fmtClock(item.sec ?? 30)}`
  }
}

function ItemList({ items, onInfo }: { items: RoutineItem[]; onInfo: (exercise: Exercise) => void }) {
  const fmt = useFormat()
  const target = useTarget()
  const { byId } = useAllExercises()
  return (
    <Card padded={false} className="py-1">
      {items.map((item, i) => {
        const ex = byId(item.exerciseId)
        return (
          <button
            key={i}
            type="button"
            disabled={!ex}
            onClick={() => ex && onInfo(ex)}
            className="flex min-h-14 w-full items-center gap-3 rounded-card px-4 py-2 text-start transition-colors enabled:active:bg-surface-2"
          >
            <span className="min-w-0 flex-1 truncate text-base text-text">{fmt.exerciseName(item.exerciseId)}</span>
            <span className="shrink-0 text-sm font-medium text-muted tabular-nums" dir="ltr">
              {target(item)}
            </span>
          </button>
        )
      })}
    </Card>
  )
}

function TemplateView({ template }: { template: ProgramTemplate }) {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const toast = useToast()
  const place = useSettings((s) => s.place)
  const gear = useHomeGear()
  const { byId } = useAllExercises()
  const [info, setInfo] = useState<Exercise | null>(null)
  const [starting, setStarting] = useState(false)
  const fit = templateFit(template, template.place, gear, byId)

  return (
    <Screen
      title={pick(template.name, lang)}
      subtitle={pick(template.description, lang)}
      onBack={() => navigate(-1)}
      footer={
        <Button
          size="lg"
          fullWidth
          icon={<Play className="size-6" />}
          loading={starting}
          onClick={async () => {
            setStarting(true)
            try {
              await startProgramFromTemplate(template.id, lang)
              if (place !== template.place) useSettings.getState().set({ place: template.place })
              toast(t('programs.started'), { tone: 'ok' })
              navigate(routes.today, { replace: true })
            } finally {
              setStarting(false)
            }
          }}
        >
          {t('programs.start')}
        </Button>
      }
    >
      <div className="flex flex-wrap gap-1.5 px-5 pb-2">
        <Badge tone={template.place}>{t(`common.place.${template.place}`)}</Badge>
        <Badge>{t('programs.perWeek', { n: template.daysPerWeek })}</Badge>
        <Badge>{t(`common.level.${template.level}`)}</Badge>
      </div>
      {!fit.fits && (
        <p className="mx-5 my-2 flex items-start gap-2 rounded-control bg-warn-soft p-3 text-sm text-warn">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {t('programs.missingGear', { n: fit.missing.length })}
        </p>
      )}
      {template.days.map((day, i) => (
        <Section key={i} title={pick(day.name, lang)}>
          <ItemList items={day.items} onInfo={setInfo} />
        </Section>
      ))}
      <ExerciseInfoSheet exercise={info} onClose={() => setInfo(null)} />
    </Screen>
  )
}

function UserProgramView({ id }: { id: string }) {
  const t = useT()
  const navigate = useNavigate()
  const data = useLiveQuery(() => getProgramWithRoutines(id), [id])
  const activeId = useSettings((s) => s.activeProgramId)
  const setSettings = useSettings((s) => s.set)
  const [confirm, setConfirm] = useState(false)
  const [renaming, setRenaming] = useState(false)

  if (data === undefined) return null
  if (data === null) {
    return (
      <Screen title={t('programs.title')} onBack={() => navigate(-1)}>
        <EmptyState icon={<SearchX className="size-8" />} title={t('programs.notFound')} />
      </Screen>
    )
  }

  const { program, routines } = data
  const active = program.id === activeId

  async function move(from: number, to: number) {
    const ids = routines.map((r) => r.id)
    const [moved] = ids.splice(from, 1)
    if (!moved) return
    ids.splice(to, 0, moved)
    await updateProgram(program.id, { routineIds: ids })
  }

  return (
    <Screen
      title={program.name}
      subtitle={`${t(`common.place.${program.place}`)} · ${t('programs.days', { n: routines.length })}`}
      onBack={() => navigate(-1)}
      actions={
        <>
          <IconButton label={t('programs.rename')} icon={<Pencil className="size-5" />} onClick={() => setRenaming(true)} />
          <IconButton label={t('programs.delete')} icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)} />
        </>
      }
    >
      <Section>
        {active ? (
          <Badge tone="accent">{t('programs.active')}</Badge>
        ) : (
          <Button fullWidth onClick={() => setSettings({ activeProgramId: program.id })}>
            {t('programs.makeActive')}
          </Button>
        )}
      </Section>

      <Section title={t('programs.rotation')}>
        <p className="mb-3 text-sm text-muted">{t('programs.rotationHint')}</p>
        {routines.length > 0 && (
          <Card padded={false} className="py-1">
            {routines.map((r, i) => (
              <RoutineRow
                key={r.id}
                routine={r}
                index={i}
                count={routines.length}
                onOpen={() => navigate(routes.routine(r.id))}
                onMove={(to) => void move(i, to)}
              />
            ))}
          </Card>
        )}
        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          icon={<Plus className="size-5" />}
          onClick={() => navigate(`${routes.routine('new')}?program=${program.id}`)}
        >
          {t('programs.addDay')}
        </Button>
      </Section>

      <RenameSheet program={program} open={renaming} onClose={() => setRenaming(false)} />
      <ConfirmDialog
        open={confirm}
        title={t('programs.deleteTitle')}
        message={t('programs.deleteBody')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          setConfirm(false)
          await deleteProgram(program.id)
          navigate(routes.programs, { replace: true })
        }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  )
}

function RoutineRow({
  routine,
  index,
  count,
  onOpen,
  onMove,
}: {
  routine: Routine
  index: number
  count: number
  onOpen: () => void
  onMove: (to: number) => void
}) {
  const t = useT()
  return (
    <div className="flex items-center gap-1 pe-2">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-h-16 min-w-0 flex-1 items-center gap-3 rounded-card px-4 py-2 text-start transition-colors active:bg-surface-2"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-bold text-muted tabular-nums">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-medium text-text">{routine.name}</span>
          <span className="block text-sm text-muted">{t('today.exerciseCount', { n: routine.items.length })}</span>
        </span>
      </button>
      <IconButton label={t('common.moveUp')} icon={<ArrowUp className="size-5" />} disabled={index === 0} onClick={() => onMove(index - 1)} />
      <IconButton
        label={t('common.moveDown')}
        icon={<ArrowDown className="size-5" />}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      />
    </div>
  )
}

function RenameSheet({ program, open, onClose }: { program: UserProgram; open: boolean; onClose: () => void }) {
  const t = useT()
  const [name, setName] = useState(program.name)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('programs.rename')}
      footer={
        <Button
          size="lg"
          fullWidth
          disabled={!name.trim()}
          onClick={async () => {
            await updateProgram(program.id, { name: name.trim() })
            onClose()
          }}
        >
          {t('common.save')}
        </Button>
      }
    >
      <TextField label={t('programs.name')} value={name} onChange={setName} autoFocus maxLength={60} />
    </Sheet>
  )
}
