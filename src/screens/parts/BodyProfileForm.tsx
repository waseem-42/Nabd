import { useT } from '@/i18n'
import { kgToUnit, unitToKg } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import type { Level } from '@/types'
import { Segmented, Stepper } from '@/ui'
import { useFormat } from './useFormat'

const DEFAULT_KG = 75
const DEFAULT_CM = 170

/**
 * Weight (owned by the caller: onboarding saves it at the end, settings on demand), plus
 * height and training background, which write straight to settings.
 */
export function BodyProfileForm({
  weightKg,
  onWeight,
  allowSkip,
}: {
  weightKg: number | null
  onWeight: (kg: number | null) => void
  allowSkip?: boolean
}) {
  const t = useT()
  const fmt = useFormat()
  const level = useSettings((s) => s.level)
  const heightCm = useSettings((s) => s.heightCm)
  const set = useSettings((s) => s.set)
  const shown = Math.round(kgToUnit(weightKg ?? DEFAULT_KG, fmt.unit) * 10) / 10

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-muted">{t('body.weight')}</p>
        <Stepper
          label={t('body.weight')}
          value={shown}
          onChange={(v) => onWeight(Math.round(unitToKg(v, fmt.unit) * 100) / 100)}
          step={fmt.unit === 'kg' ? 0.5 : 1}
          decimals={1}
          min={25}
          max={fmt.unit === 'kg' ? 300 : 660}
          unit={fmt.unitLabel}
          className={weightKg === null ? 'opacity-60' : undefined}
        />
        {allowSkip && (
          <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-muted">
            <input
              type="checkbox"
              className="size-5 accent-[var(--color-accent)]"
              checked={weightKg === null}
              onChange={(e) => onWeight(e.target.checked ? null : DEFAULT_KG)}
            />
            {t('body.skipWeight')}
          </label>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-muted">{t('body.height')}</p>
        <Stepper
          label={t('body.height')}
          value={heightCm ?? DEFAULT_CM}
          onChange={(v) => set({ heightCm: v })}
          min={120}
          max={230}
          unit={t('body.cm')}
          className={heightCm === null ? 'opacity-60' : undefined}
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-muted">{t('body.level')}</p>
        <Segmented<Level>
          label={t('body.level')}
          value={level}
          onChange={(value) => set({ level: value })}
          options={[
            { value: 'beginner', label: t('common.level.beginner') },
            { value: 'intermediate', label: t('common.level.intermediate') },
            { value: 'advanced', label: t('common.level.advanced') },
          ]}
        />
        <p className="mt-2 text-sm text-faint">{t(`body.level.${level}`)}</p>
      </div>
    </div>
  )
}
