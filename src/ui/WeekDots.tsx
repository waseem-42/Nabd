import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { startOfWeek } from '@/domain/progress'
import { useLang, useT } from '@/i18n'
import { localeOf } from '@/i18n/format'
import { cx } from './cx'

export interface WeekDotsProps {
  /** Today as 'YYYY-MM-DD' (local). The shown week is the week containing it (domain/progress decides the first day). */
  today: string
  /** ISO days that have a finished workout. */
  trainedDays: readonly string[]
  className?: string
}

function parse(iso: string): Date {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Seven days, Saturday first (as weekSummary). Trained days are filled; today is outlined. */
export function WeekDots({ today, trainedDays, className }: WeekDotsProps) {
  const t = useT()
  const lang = useLang()
  const days = useMemo(() => {
    const t0 = parse(today)
    const start = startOfWeek(t0.getTime())
    const fmt = new Intl.DateTimeFormat(localeOf(lang), { weekday: 'narrow' })
    const full = new Intl.DateTimeFormat(localeOf(lang), { weekday: 'long' })
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      return { iso: toIso(d), label: fmt.format(d), full: full.format(d), n: d.getDate() }
    })
  }, [today, lang])
  const trained = useMemo(() => new Set(trainedDays), [trainedDays])

  return (
    <ul className={cx('m-0 grid list-none grid-cols-7 gap-1 p-0', className)}>
      {days.map((d) => {
        const done = trained.has(d.iso)
        const isToday = d.iso === today
        return (
          <li
            key={d.iso}
            className="flex min-w-0 flex-col items-center gap-2"
            aria-label={`${d.full}${isToday ? `, ${t('common.tab.today')}` : ''}: ${done ? t('common.trained') : t('common.restDay')}`}
          >
            <span className={cx('text-xs font-medium', isToday ? 'text-text' : 'text-muted')} aria-hidden>
              {d.label}
            </span>
            <span
              aria-hidden
              className={cx(
                'flex aspect-square w-full max-w-10 items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums',
                done ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-surface text-faint',
                isToday && !done && 'border-text text-text',
                isToday && done && 'ring-2 ring-text ring-offset-2 ring-offset-bg',
              )}
            >
              {done ? <Check className="size-5" strokeWidth={3} /> : d.n}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
