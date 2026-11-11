import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useT } from '@/i18n'
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP } from '@/types'
import type { Exercise, MuscleGroup } from '@/types'
import { ChipRow } from './ChipRow'
import { EmptyState } from './EmptyState'
import { ExerciseRow } from './ExerciseRow'
import { SearchField } from './SearchField'
import { Sheet } from './Sheet'

export interface ExercisePickerSheetProps {
  open: boolean
  onClose: () => void
  exercises: readonly Exercise[]
  onPick: (exercise: Exercise) => void
  /** Defaults to common.pickExercise. */
  title?: string
  /** Exercises to hide (already in the routine). */
  excludeIds?: readonly string[]
  /** Exercise ids to offer first (most recent first) while nothing is being searched. */
  recentIds?: readonly string[]
}

/** Lower-case, strip Latin/Arabic diacritics and tatweel, fold alef/yaa/taa-marbuta variants. */
export function normalizeSearch(s: string): string {
  return s
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[ً-ٰٟـ̀-ͯ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
}

const PAGE = 40
type GroupFilter = 'all' | MuscleGroup

export function ExercisePickerSheet({
  open,
  onClose,
  exercises,
  onPick,
  title,
  excludeIds,
  recentIds,
}: ExercisePickerSheetProps) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState<GroupFilter>('all')
  const [limit, setLimit] = useState(PAGE)
  const sentinel = useRef<HTMLLIElement>(null)

  // Search index computed once per exercise list, not per keystroke.
  const index = useMemo(
    () => exercises.map((e) => ({ e, key: normalizeSearch(`${e.name.ar} ${e.name.en}`) })),
    [exercises],
  )

  const results = useMemo(() => {
    const q = normalizeSearch(query)
    const words = q ? q.split(' ') : []
    const skip = excludeIds ? new Set(excludeIds) : null
    return index
      .filter(({ e, key }) => {
        if (skip?.has(e.id)) return false
        if (group !== 'all' && MUSCLE_TO_GROUP[e.primary] !== group) return false
        return words.every((w) => key.includes(w))
      })
      .map(({ e }) => e)
  }, [index, query, group, excludeIds])

  // Reset paging when the filter changes; the list is windowed by growing `limit` on scroll.
  useEffect(() => setLimit(PAGE), [query, group, open])

  const shown = results.slice(0, limit)
  const hasMore = results.length > limit

  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => e?.isIntersecting && setLimit((n) => n + PAGE),
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, shown.length])

  const recent = useMemo(() => {
    if (!recentIds?.length || query.trim() || group !== 'all') return []
    const available = new Map(results.map((e) => [e.id, e]))
    return recentIds.map((id) => available.get(id)).filter((e): e is Exercise => !!e).slice(0, 5)
  }, [recentIds, results, query, group])

  const options = useMemo(
    () => [
      { value: 'all' as GroupFilter, label: t('common.all') },
      ...MUSCLE_GROUPS.map((g) => ({ value: g as GroupFilter, label: t(`common.group.${g}`) })),
    ],
    [t],
  )

  return (
    <Sheet open={open} onClose={onClose} title={title ?? t('common.pickExercise')} tall>
      <div className="sticky -top-px z-10 -mx-5 flex flex-col gap-3 bg-surface px-5 pb-3">
        <SearchField value={query} onChange={setQuery} placeholder={t('common.searchExercises')} />
        <ChipRow options={options} value={group} onChange={setGroup} label={t('common.filter')} />
      </div>
      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-8" />}
          title={t('common.noResults')}
          body={t('common.noResultsHint')}
        />
      ) : (
        <ul className="-mx-4 m-0 list-none p-0">
          {recent.length > 0 && (
            <>
              <li className="px-4 pt-1 pb-1 text-sm font-medium text-muted">{t('workout.recent')}</li>
              {recent.map((e) => (
                <li key={`recent-${e.id}`}>
                  <ExerciseRow exercise={e} onClick={() => onPick(e)} />
                </li>
              ))}
              <li className="mt-2 border-t border-line px-4 pt-3 pb-1 text-sm font-medium text-muted">{t('workout.allExercises')}</li>
            </>
          )}
          {shown.map((e) => (
            <li key={e.id}>
              <ExerciseRow
                exercise={e}
                onClick={() => {
                  onPick(e)
                }}
              />
            </li>
          ))}
          {hasMore && <li ref={sentinel} aria-hidden className="h-8" />}
        </ul>
      )}
    </Sheet>
  )
}
