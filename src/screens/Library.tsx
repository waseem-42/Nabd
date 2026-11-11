import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowUpLeft, Check, Plus, Search, Sparkles, X } from 'lucide-react'
import { routes } from '@/app/routes'
import { useAllExercises, useDoneSessions } from '@/db'
import { workSets } from '@/domain/progress'
import { findRig } from '@/motion/engine'
import { fitsPlace } from '@/domain/place'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { EQUIPMENT, MUSCLE_GROUPS, MUSCLE_TO_GROUP, type Equipment, type LoggedSet, type MuscleGroup } from '@/types'
import { Button, Chip, ChipRow, EmptyState, EquipmentIcon, ExerciseRow, IconButton, MuscleGroupIcon, normalizeSearch, Screen, SearchField } from '@/ui'
import { CustomExerciseSheet } from './parts/CustomExerciseSheet'
import { useFormat, useHomeGear } from './parts/useFormat'

const PAGE = 40
type GroupFilter = 'all' | MuscleGroup
type EquipmentFilter = 'all' | Equipment
/** One extra narrowing at a time: animated, trained before, or the user's own. */
type Only = 'all' | 'motion' | 'trained' | 'mine'

export default function Library() {
  const t = useT()
  const navigate = useNavigate()
  const place = useSettings((s) => s.place)
  const gear = useHomeGear()
  const { exercises } = useAllExercises()
  // Filters live in the URL so coming back from an exercise keeps them.
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const group = (params.get('g') ?? 'all') as GroupFilter
  const fitOnly = params.get('fit') !== '0'
  const equipment = (params.get('eq') ?? 'all') as EquipmentFilter
  const only = (params.get('only') ?? 'all') as Only
  const fmt = useFormat()
  const sessions = useDoneSessions()

  /** Newest work sets per exercise: the "last time" line and the "trained" filter. */
  const lastById = useMemo(() => {
    const map = new Map<string, LoggedSet[]>()
    for (const s of sessions ?? []) {
      for (const e of s.entries) {
        if (map.has(e.exerciseId)) continue
        const sets = workSets(e)
        if (sets.length) map.set(e.exerciseId, sets)
      }
    }
    return map
  }, [sessions])
  const [limit, setLimit] = useState(PAGE)
  const [creating, setCreating] = useState(false)
  const sentinel = useRef<HTMLLIElement>(null)

  function update(key: string, value: string, fallback: string) {
    setParams(
      (p) => {
        const next = new URLSearchParams(p)
        if (value === fallback) next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const index = useMemo(
    () => exercises.map((e) => ({ e, key: normalizeSearch(`${e.name.ar} ${e.name.en}`) })),
    [exercises],
  )
  const results = useMemo(() => {
    const words = normalizeSearch(query).split(' ').filter(Boolean)
    return index
      .filter(({ e, key }) => {
        if (group !== 'all' && MUSCLE_TO_GROUP[e.primary] !== group) return false
        if (fitOnly && !fitsPlace(e, place, gear)) return false
        if (equipment !== 'all' && e.equipment !== equipment) return false
        if (only === 'motion' && !findRig(e.id)) return false
        if (only === 'trained' && !lastById.has(e.id)) return false
        if (only === 'mine' && !e.custom) return false
        return words.every((w) => key.includes(w))
      })
      .map(({ e }) => e)
  }, [index, query, group, fitOnly, place, gear, equipment, only, lastById])

  useEffect(() => setLimit(PAGE), [query, group, fitOnly, place, equipment, only])
  const shown = results.slice(0, limit)
  const hasMore = results.length > limit

  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => e?.isIntersecting && setLimit((n) => n + PAGE), { rootMargin: '400px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, shown.length])

  const groups = useMemo(
    () => [
      { value: 'all' as GroupFilter, label: t('common.all') },
      ...MUSCLE_GROUPS.map((g) => ({ value: g as GroupFilter, label: t(`common.group.${g}`), icon: <MuscleGroupIcon group={g} className="h-5" /> })),
    ],
    [t],
  )

  const equipments = useMemo(
    () => [
      { value: 'all' as EquipmentFilter, label: t('library.anyEquipment') },
      ...EQUIPMENT.filter((e) => e !== 'other').map((e) => ({ value: e as EquipmentFilter, label: t(`common.equipment.${e}`), icon: <EquipmentIcon equipment={e} className="size-4" /> })),
    ],
    [t],
  )
  const hasCustom = exercises.some((e) => e.custom)
  const filtered = !!query || group !== 'all' || equipment !== 'all' || only !== 'all'
  const toggleOnly = (value: Only) => update('only', only === value ? 'all' : value, 'all')
  const clearFilters = () => setParams(fitOnly ? {} : { fit: '0' }, { replace: true })

  return (
    <Screen
      title={t('common.tab.library')}
      actions={<IconButton label={t('library.create')} icon={<Plus className="size-6" />} variant="solid" onClick={() => setCreating(true)} />}
    >
      <div className="px-5 pt-1 pb-4"><p className="mb-5 text-sm text-muted">{t('motion.libraryIntro')}</p><button type="button" onClick={() => navigate(routes.motionBatch)} className="motion-invitation flex w-full items-center gap-3 rounded-card border border-accent/20 bg-accent-soft p-4 text-start"><span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-accent text-accent-ink"><Sparkles className="size-5" aria-hidden /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-text">{t('motion.libraryHint')}</span><span className="mt-1 block text-xs leading-relaxed text-muted">{t('motion.libraryBody')}</span></span><ArrowUpLeft className="size-5 shrink-0 text-accent ltr:-scale-x-100" aria-hidden /></button></div>
      <div className="sticky top-0 z-10 flex flex-col gap-3 border-b border-line/60 bg-bg/95 px-5 pt-3 pb-4 backdrop-blur-xl">
        <SearchField value={query} onChange={(v) => update('q', v, '')} placeholder={t('common.searchExercises')} />
        <ChipRow options={groups} value={group} onChange={(g) => update('g', g, 'all')} label={t('common.filter')} />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-4">
        <ChipRow options={equipments} value={equipment} onChange={(e) => update('eq', e, 'all')} label={t('library.equipment')} />
        <div role="group" aria-label={t('library.quickFilters')} className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1">
          <Chip selected={fitOnly} icon={fitOnly ? <Check className="size-4" /> : undefined} onClick={() => update('fit', fitOnly ? '0' : '1', '1')}>
            {t('library.fitsPlace', { place: t(`common.place.${place}`) })}
          </Chip>
          <Chip selected={only === 'motion'} icon={<Sparkles className="size-4" />} onClick={() => toggleOnly('motion')}>
            {t('library.onlyMotion')}
          </Chip>
          {lastById.size > 0 && (
            <Chip selected={only === 'trained'} onClick={() => toggleOnly('trained')}>
              {t('library.onlyTrained')}
            </Chip>
          )}
          {hasCustom && (
            <Chip selected={only === 'mine'} onClick={() => toggleOnly('mine')}>
              {t('library.onlyMine')}
            </Chip>
          )}
        </div>
        <div className="flex min-h-9 items-center justify-between gap-3">
          <span className="text-sm text-muted tabular-nums">{t('library.count', { n: results.length })}</span>
          {filtered && (
            <button type="button" onClick={clearFilters} className="inline-flex min-h-9 items-center gap-1 text-sm font-medium text-accent">
              <X className="size-4" aria-hidden />
              {t('library.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-8" />}
          title={t('common.noResults')}
          body={fitOnly ? t('library.emptyFitHint', { place: t(`common.place.${place}`) }) : t('common.noResultsHint')}
          action={
            fitOnly ? (
              <Button variant="secondary" onClick={() => update('fit', '0', '1')}>{t('library.showAllPlaces')}</Button>
            ) : filtered ? (
              <Button variant="secondary" onClick={clearFilters}>{t('library.clearFilters')}</Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 px-5 py-4">
          {shown.map((e) => (
            <li key={e.id} className="overflow-hidden rounded-card border border-line bg-surface">
              <ExerciseRow
                exercise={e}
                onClick={() => navigate(routes.exercise(e.id))}
                note={lastById.has(e.id) ? `${t('workout.lastTime')}: ${fmt.set(lastById.get(e.id)!.at(-1)!, e.mode)}` : undefined}
              />
            </li>
          ))}
          {hasMore && <li ref={sentinel} aria-hidden className="h-8" />}
        </ul>
      )}

      <CustomExerciseSheet
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={(ex) => navigate(routes.exercise(ex.id))}
      />
    </Screen>
  )
}
