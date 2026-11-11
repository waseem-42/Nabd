import { Dumbbell, House } from 'lucide-react'
import { useT } from '@/i18n'
import type { Place } from '@/types'
import { cx } from './cx'

export interface PlaceToggleProps {
  value: Place
  onChange: (place: Place) => void
  size?: 'md' | 'lg'
  className?: string
}

const PLACES: Array<{ value: Place; icon: typeof House }> = [
  { value: 'home', icon: House },
  { value: 'gym', icon: Dumbbell },
]

/** Home (sand) / Gym (sage). Secondary colours keep coral reserved for the main action. */
export function PlaceToggle({ value, onChange, size = 'lg', className }: PlaceToggleProps) {
  const t = useT()
  const gym = value === 'gym'
  return (
    <div
      role="radiogroup"
      aria-label={t('common.placeLabel')}
      className={cx(
        'relative grid grid-cols-2 rounded-control border border-line bg-surface p-1',
        className,
      )}
    >
      <span
        aria-hidden
        className={cx(
          'absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-[0.65rem] shadow-lift transition-[inset-inline-start,background-color] duration-300 ease-out-back',
          gym ? 'start-[50%] bg-gym' : 'start-1 bg-home',
        )}
      />
      {PLACES.map(({ value: v, icon: Icon }) => {
        const active = v === value
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cx(
              'relative z-10 flex items-center justify-center gap-2 rounded-[0.65rem] font-semibold transition-colors duration-200',
              size === 'lg' ? 'min-h-14 text-lg' : 'min-h-12 text-base',
              active ? (v === 'home' ? 'text-home-ink' : 'text-gym-ink') : 'text-muted',
            )}
          >
            <Icon className={size === 'lg' ? 'size-6' : 'size-5'} aria-hidden />
            {t(`common.place.${v}`)}
          </button>
        )
      })}
    </div>
  )
}
