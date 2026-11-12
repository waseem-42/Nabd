import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '@/app/routes'
import { useAllExercises } from '@/db'
import { animatedFor } from '@/domain/animated'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP, type MuscleGroup } from '@/types'
import { MuscleGroupIcon, SearchField, cx, normalizeSearch } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { useFormat, useHomeGear } from './parts/useFormat'

/** Exercises: every one has a clear animation, and only those that fit the current place show. */
export default function Exercises() {
  const t = useT()
  const fmt = useFormat()
  const place = useSettings((s) => s.place)
  const gear = useHomeGear()
  const { exercises } = useAllExercises()
  const [group, setGroup] = useState<MuscleGroup | null>(null)
  const [query, setQuery] = useState('')

  const here = useMemo(() => animatedFor(exercises, place, gear), [exercises, place, gear])
  const groups = MUSCLE_GROUPS.filter((g) => here.some((e) => MUSCLE_TO_GROUP[e.primary] === g))
  const shown = useMemo(() => {
    const q = normalizeSearch(query)
    return here.filter((e) => (!group || MUSCLE_TO_GROUP[e.primary] === group) && (!q || normalizeSearch(`${e.name.ar} ${e.name.en}`).includes(q)))
  }, [here, group, query])

  return (
    <div className="flex flex-col gap-4 pt-2">
      <h1 className="sr-only">{t('app.tab.exercises')}</h1>
      <div className="px-5"><SearchField value={query} onChange={setQuery} placeholder={t('common.searchExercises')} /></div>
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label={t('app.groups')}>
        {[null, ...groups].map((g) => (
          <button
            key={g ?? 'all'}
            type="button"
            aria-pressed={group === g}
            onClick={() => setGroup(g)}
            className={cx('flex min-h-11 shrink-0 items-center gap-1.5 rounded-pill border px-4 text-sm font-semibold', group === g ? 'border-text bg-text text-bg' : 'border-line text-muted')}
          >
            {g && <MuscleGroupIcon group={g} className="size-5" />}
            {g ? t(`common.group.${g}`) : t('common.all')}
          </button>
        ))}
      </div>
      <p className="px-5 text-sm text-muted">{t('app.count', { n: fmt.number(shown.length) })}</p>
      {shown.length === 0 ? (
        <div className="mx-5 rounded-card border border-line bg-surface p-5 text-center">
          <p className="mb-3 text-muted">{t('app.noneHere')}</p>
          <Link to={routes.settings} className="font-semibold text-accent">{t('app.editGear')}</Link>
        </div>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 px-5 p-0">
          {shown.map((exercise) => (
            <li key={exercise.id}>
              <Link to={routes.exercise(exercise.id)} className="block overflow-hidden rounded-card border border-line bg-surface">
                <MotionThumb exerciseId={exercise.id} name={fmt.exerciseName(exercise.id)} className="aspect-square w-full" />
                <span className="block px-3 pt-2 pb-3">
                  <span className="line-clamp-2 block text-sm font-bold leading-snug">{fmt.exerciseName(exercise.id)}</span>
                  <span className="block text-xs text-muted">{t(`common.muscle.${exercise.primary}`)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
