import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Check, ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import { routes } from '@/app/routes'
import { createProgram, deleteProgram, followProgram, getProgramWithRoutines, useActiveProgram, usePrograms } from '@/db'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { UserProgram } from '@/types'
import { Button, ConfirmDialog, Screen, Sheet, TextField, cx } from '@/ui'
import { PlanPicker } from './Home'
import { useFormat } from './parts/useFormat'

/** Plans for the current place: yours (follow, edit days, delete) and the ready ones. */
export default function Plans() {
  const t = useT()
  const navigate = useNavigate()
  const place = useSettings((s) => s.place)
  const programs = usePrograms()
  const current = useActiveProgram()
  const mine = (programs ?? []).filter((p) => p.place === place)
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')

  async function create() {
    if (!name.trim()) return
    const program = await createProgram({ name: name.trim(), place, routineIds: [] })
    followProgram(program)
    setNaming(false)
    setName('')
    navigate(`${routes.routine('new')}?program=${program.id}`)
  }

  return (
    <Screen title={t('app.plans')} subtitle={t(`common.place.${place}`)} onBack={() => navigate(-1)}>
      <div className="flex flex-col gap-6 px-5 pb-10">
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{t('app.myPlans')}</h2>
            <Button size="md" variant="secondary" icon={<Plus className="size-5" />} onClick={() => setNaming(true)}>{t('app.newPlan')}</Button>
          </div>
          {mine.map((program) => <MyPlan key={program.id} program={program} following={current?.program.id === program.id} />)}
        </section>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t('app.readyPlans')}</h2>
          <PlanPicker compact />
        </section>
      </div>
      <Sheet open={naming} onClose={() => setNaming(false)} title={t('app.newPlan')} footer={<Button fullWidth disabled={!name.trim()} onClick={() => void create()}>{t('common.next')}</Button>}>
        <TextField label={t('programs.name')} value={name} onChange={setName} autoFocus />
      </Sheet>
    </Screen>
  )
}

function MyPlan({ program, following }: { program: UserProgram; following: boolean }) {
  const t = useT()
  const fmt = useFormat()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const detail = useLiveQuery(() => (open ? getProgramWithRoutines(program.id) : undefined), [open, program.id])
  return (
    <article className={cx('rounded-card border bg-surface', following ? 'border-accent/40' : 'border-line')}>
      <div className="flex items-center gap-3 p-4">
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-2 text-start">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{fmt.planName(program.name)}</span>
            <span className="block text-xs text-muted">{t('app.daysPerWeek', { n: fmt.number(program.routineIds.length) })}</span>
          </span>
          <ChevronDown className={cx('size-5 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
        </button>
        {following ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-accent"><Check className="size-4" aria-hidden />{t('app.following')}</span>
        ) : (
          <Button size="md" variant="secondary" onClick={() => followProgram(program)}>{t('app.follow')}</Button>
        )}
      </div>
      {open && detail && (
        <div className="flex flex-col gap-2 border-t border-line p-3">
          {detail.routines.map((routine) => (
            <button key={routine.id} type="button" onClick={() => navigate(routes.routine(routine.id))} className="flex min-h-12 items-center gap-3 rounded-control bg-bg px-3 text-start">
              <span className="flex-1 font-semibold">{fmt.planName(routine.name)}</span>
              <span className="text-xs text-muted">{t('app.exerciseCount', { n: fmt.number(routine.items.length) })}</span>
              <Pencil className="size-4 text-muted" aria-hidden />
            </button>
          ))}
          <div className="mt-1 flex gap-2">
            <Button size="md" variant="secondary" icon={<Plus className="size-5" />} onClick={() => navigate(`${routes.routine('new')}?program=${program.id}`)}>{t('programs.addDay')}</Button>
            <Button size="md" variant="ghost" icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)}>{t('common.delete')}</Button>
          </div>
        </div>
      )}
      <ConfirmDialog open={confirm} title={t('programs.deleteTitle')} message={t('programs.deleteBody')} confirmLabel={t('common.delete')} tone="danger" onConfirm={() => { setConfirm(false); void deleteProgram(program.id) }} onCancel={() => setConfirm(false)} />
    </article>
  )
}
