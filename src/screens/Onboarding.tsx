import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/routes'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { Lang, Unit } from '@/types'
import { Brand, BrandMark, Button, cx, PlaceToggle, Segmented } from '@/ui'
import { upsertBodyWeight } from '@/db'
import { isoDay } from '@/i18n/format'
import { BodyProfileForm } from './parts/BodyProfileForm'
import { HomeGearPicker } from './parts/HomeGearPicker'

const STEPS = 4

/** First run: language and unit, about you, where you train, what you have at home. Then pick a program. */
export default function Onboarding() {
  const t = useT()
  const navigate = useNavigate()
  const settings = useSettings()
  const [step, setStep] = useState(0)
  const [weightKg, setWeightKg] = useState<number | null>(75)

  function finish(withProgram: boolean) {
    if (weightKg !== null) void upsertBodyWeight(isoDay(), weightKg)
    settings.set({ onboarded: true })
    navigate(withProgram ? routes.programs : routes.today, { replace: true })
  }

  const last = step === STEPS - 1

  return (
    <div className="flex flex-1 flex-col px-6 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="mb-3 flex items-center justify-between gap-4">
        <BrandMark className="size-8" />
        <p className="text-sm text-muted">{t('brand.tagline')}</p>
      </div>
      <div className="mt-3 flex items-center gap-2" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={cx('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-8 bg-accent' : 'w-1.5 bg-line-strong')}
          />
        ))}
      </div>

      <div className="flex-1 py-8">
        {step === 0 && (
          <div className="flex flex-col gap-8">
            <div className="pt-2">
              <Brand size="lg" className="mb-7" />
              <div className="brand-manifesto">
                <h1 className="max-w-xs text-display font-bold leading-[1.35] text-text">{t('brand.promise')}</h1>
                <p className="mt-3 max-w-xs text-base text-muted">{t('onboarding.tagline')}</p>
              </div>
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted">{t('onboarding.language')}</p>
              <Segmented<Lang>
                label={t('onboarding.language')}
                value={settings.lang}
                onChange={(lang) => settings.set({ lang })}
                options={[
                  { value: 'ar', label: 'العربية' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium text-muted">{t('onboarding.unit')}</p>
              <Segmented<Unit>
                label={t('onboarding.unit')}
                value={settings.unit}
                onChange={(unit) => settings.set({ unit })}
                options={[
                  { value: 'kg', label: t('common.unit.kg') },
                  { value: 'lb', label: t('common.unit.lb') },
                ]}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-title font-bold text-text">{t('body.title')}</h1>
              <p className="mt-2 text-base text-muted">{t('body.intro')}</p>
            </div>
            <BodyProfileForm weightKg={weightKg} onWeight={setWeightKg} allowSkip />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-title font-bold text-text">{t('common.placeLabel')}</h1>
              <p className="mt-2 text-base text-muted">{t('onboarding.placeBody')}</p>
            </div>
            <PlaceToggle value={settings.place} onChange={(place) => settings.set({ place })} />
            <p className="text-sm text-faint">{t('onboarding.placeHint')}</p>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-title font-bold text-text">{t('onboarding.gearTitle')}</h1>
              <p className="mt-2 text-base text-muted">{t('onboarding.gearBody')}</p>
            </div>
            <HomeGearPicker />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {last ? (
          <>
            <Button size="lg" fullWidth onClick={() => finish(true)}>
              {t('onboarding.pickProgram')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => finish(false)}>
              {t('onboarding.skipProgram')}
            </Button>
          </>
        ) : (
          <Button size="lg" fullWidth onClick={() => setStep(step + 1)}>
            {t('common.next')}
          </Button>
        )}
        {step > 0 && (
          <Button variant="ghost" fullWidth onClick={() => setStep(step - 1)}>
            {t('common.back')}
          </Button>
        )}
      </div>
    </div>
  )
}
