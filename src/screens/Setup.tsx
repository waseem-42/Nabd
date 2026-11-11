import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { routes } from '@/app/routes'
import { startProgramFromTemplate, upsertBodyWeight } from '@/db'
import { recommendTemplate } from '@/domain/recommend'
import { useLang, useT } from '@/i18n'
import { isoDay } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import type { Accessory, Equipment, Level, Place } from '@/types'
import { Brand, Button, Stepper, cx } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'

type Step = 'place' | 'gear' | 'level'

/** First run: where you train, what you have at home, your level. Then a plan is ready. */
export default function Setup() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const settings = useSettings()
  const [step, setStep] = useState<Step>('place')
  const [place, setPlace] = useState<Place>(settings.place)
  const [equipment, setEquipment] = useState<Equipment[]>(settings.homeEquipment)
  const [accessories, setAccessories] = useState<Accessory[]>(settings.homeAccessories)
  const [level, setLevel] = useState<Level>(settings.level === 'advanced' ? 'intermediate' : settings.level)
  const [weight, setWeight] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const steps: Step[] = place === 'home' ? ['place', 'gear', 'level'] : ['place', 'level']
  const index = steps.indexOf(step)
  const Forward = lang === 'ar' ? ArrowLeft : ArrowRight

  async function finish() {
    setBusy(true)
    const gear = { homeEquipment: equipment.includes('bodyweight') ? equipment : ['bodyweight' as Equipment, ...equipment], homeAccessories: accessories }
    settings.set({ place, level, ...gear })
    if (weight) await upsertBodyWeight(isoDay(Date.now()), weight)
    const template = recommendTemplate(place, gear, level)
    if (template) await startProgramFromTemplate(template.id, lang)
    settings.set({ onboarded: true })
    navigate(routes.today, { replace: true })
  }

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value])

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center justify-between">
        <Brand />
        <button type="button" onClick={() => settings.set({ lang: lang === 'ar' ? 'en' : 'ar' })} className="min-h-11 rounded-pill border border-line px-4 text-sm font-semibold text-muted">
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>
      <div className="mb-6 flex gap-1.5" aria-hidden>
        {steps.map((s, i) => <span key={s} className={cx('h-1 flex-1 rounded-pill', i <= index ? 'bg-accent' : 'bg-line')} />)}
      </div>

      {step === 'place' && (
        <section className="flex flex-1 flex-col gap-4">
          <h1 className="text-3xl font-bold">{t('app.setup.where')}</h1>
          <p className="-mt-2 text-muted">{t('app.setup.whereHint')}</p>
          <div className="grid grid-cols-2 gap-3">
            {(['home', 'gym'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={place === value}
                onClick={() => setPlace(value)}
                className={cx('overflow-hidden rounded-card border-2 bg-surface text-start transition-colors', place === value ? (value === 'home' ? 'border-home' : 'border-gym') : 'border-line')}
              >
                <MotionThumb exerciseId={value === 'home' ? '6YUfHPL' : 'EIeI8Vf'} name={t(`common.place.${value}`)} className="aspect-square w-full" />
                <span className="flex items-center justify-between px-4 py-3 text-lg font-bold">
                  {t(`common.place.${value}`)}
                  {place === value && <Check className={cx('size-5', value === 'home' ? 'text-home' : 'text-gym')} aria-hidden />}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'gear' && (
        <section className="flex flex-1 flex-col gap-4">
          <h1 className="text-3xl font-bold">{t('app.setup.gear')}</h1>
          <p className="-mt-2 text-muted">{t('app.setup.gearHint')}</p>
          <div className="flex flex-col gap-3">
            {[
              { key: 'dumbbell', label: t('app.gear.dumbbell'), on: equipment.includes('dumbbell'), flip: () => setEquipment(toggle(equipment, 'dumbbell' as Equipment)), demo: 'NbVPDMW' },
              { key: 'pullup-bar', label: t('app.gear.pullupBar'), on: accessories.includes('pullup-bar'), flip: () => setAccessories(toggle(accessories, 'pullup-bar' as Accessory)), demo: 'T2mxWqc' },
              { key: 'bench', label: t('app.gear.bench'), on: accessories.includes('bench'), flip: () => setAccessories(toggle(accessories, 'bench' as Accessory)), demo: 'SpYC0Kp' },
            ].map((item) => (
              <button key={item.key} type="button" aria-pressed={item.on} onClick={item.flip} className={cx('flex items-center gap-4 rounded-card border-2 bg-surface p-2 pe-4 text-start', item.on ? 'border-home' : 'border-line')}>
                <MotionThumb exerciseId={item.demo} name={item.label} still className="size-16 rounded-control" />
                <span className="flex-1 text-lg font-semibold">{item.label}</span>
                <span className={cx('flex size-7 items-center justify-center rounded-full border-2', item.on ? 'border-home bg-home text-home-ink' : 'border-line')}>
                  {item.on && <Check className="size-4" aria-hidden />}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 'level' && (
        <section className="flex flex-1 flex-col gap-4">
          <h1 className="text-3xl font-bold">{t('app.setup.level')}</h1>
          <div className="flex flex-col gap-3">
            {(['beginner', 'intermediate'] as const).map((value) => (
              <button key={value} type="button" aria-pressed={level === value} onClick={() => setLevel(value)} className={cx('rounded-card border-2 bg-surface px-5 py-4 text-start', level === value ? 'border-accent' : 'border-line')}>
                <span className="block text-lg font-bold">{t(`app.level.${value}`)}</span>
                <span className="block text-sm text-muted">{t(`app.level.${value}Hint`)}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 rounded-card border border-line bg-surface p-4">
            <p className="mb-1 font-semibold">{t('app.setup.weight')}</p>
            <p className="mb-3 text-sm text-muted">{t('app.setup.weightHint')}</p>
            <Stepper label={t('app.setup.weight')} value={weight ?? 70} onChange={(kg) => setWeight(kg)} step={1} min={30} max={250} unit={t('common.unit.kg')} />
          </div>
        </section>
      )}

      <div className="mt-6 flex gap-3">
        {index > 0 && <Button variant="secondary" onClick={() => setStep(steps[index - 1]!)}>{t('common.back')}</Button>}
        {index < steps.length - 1 ? (
          <Button fullWidth size="lg" icon={<Forward className="size-5" />} onClick={() => setStep(steps[index + 1]!)}>{t('common.next')}</Button>
        ) : (
          <Button fullWidth size="lg" loading={busy} onClick={() => void finish()}>{t('app.setup.go')}</Button>
        )}
      </div>
    </div>
  )
}
