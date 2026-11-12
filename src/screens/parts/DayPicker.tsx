import { useLang, useT } from '@/i18n'
import { cx } from '@/ui'

/** Saturday first, the usual week start in the Arab world (see WEEK_STARTS_ON). */
const ORDER = [6, 0, 1, 2, 3, 4, 5]
// 2026-11-01 is a Sunday, so day d of that week is getDay() === d.
const dateOf = (day: number) => new Date(2026, 10, 1 + day)

/** Seven toggles for the weekdays the user trains on (0 = Sunday … 6 = Saturday). */
export function DayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  const t = useT()
  const lang = useLang()
  const locale = lang === 'ar' ? 'ar' : 'en'
  const narrow = new Intl.DateTimeFormat(locale, { weekday: 'narrow' })
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' })
  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label={t('app.days.title')}>
      {ORDER.map((day) => {
        const on = value.includes(day)
        return (
          <button
            key={day}
            type="button"
            aria-pressed={on}
            aria-label={long.format(dateOf(day))}
            onClick={() => onChange(on ? value.filter((d) => d !== day) : [...value, day].sort((a, b) => a - b))}
            className={cx('flex h-11 min-w-0 items-center justify-center rounded-full border text-sm font-bold', on ? 'border-accent bg-accent text-accent-ink' : 'border-line text-muted')}
          >
            {narrow.format(dateOf(day))}
          </button>
        )
      })}
    </div>
  )
}
