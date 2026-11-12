import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { useAllExercises, useBodyWeights } from '@/db'
import type { BodyProfile } from '@/domain/loading'
import type { HomeGear } from '@/domain/place'
import { pick, useLang, useT } from '@/i18n'
import { fmtClock, fmtNumber, fmtWeight } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import type { ExerciseMode, L10n, LoggedSet, WorkoutSession } from '@/types'

/**
 * Program and day names copied from a ready plan are stored in the language of the day they
 * were created. Any name that is still a template's own name is shown in the current language.
 */
const TEMPLATE_NAMES = new Map<string, L10n>()
for (const p of PROGRAM_TEMPLATES) for (const l10n of [p.name, ...p.days.map((d) => d.name)]) for (const s of [l10n.ar, l10n.en]) TEMPLATE_NAMES.set(s, l10n)

/** Display helpers shared by the screens: names, weights and set summaries in the user's language and unit. */
export function useFormat() {
  const t = useT()
  const lang = useLang()
  const unit = useSettings((s) => s.unit)
  const { byId } = useAllExercises()

  return useMemo(() => {
    const unitLabel = t(`common.unit.${unit}`)
    const weight = (kg: number) => fmtWeight(kg, unit, lang)
    /** "60 kg × 8", "12 reps", "0:45", "20 min". */
    const set = (s: Pick<LoggedSet, 'weight' | 'reps' | 'sec'>, mode: ExerciseMode) => {
      if (mode === 'time') return fmtClock(s.sec ?? 0)
      if (mode === 'cardio') return `${fmtNumber(Math.round((s.sec ?? 0) / 60), lang)} ${t('common.min')}`
      if (s.weight > 0) return `${weight(s.weight)} ${unitLabel} × ${fmtNumber(s.reps, lang)}`
      return `${fmtNumber(s.reps, lang)} ${t('common.reps')}`
    }

    return {
      unit,
      unitLabel,
      weight,
      /** Weight with its unit: "62.5 kg". */
      weightWithUnit: (kg: number) => `${weight(kg)} ${unitLabel}`,
      number: (n: number, decimals = 0) => fmtNumber(n, lang, decimals),
      /** Name of a catalogue exercise; a placeholder for an id no longer in it. */
      exerciseName: (id: string) => {
        const ex = byId(id)
        return ex ? pick(ex.name, lang) : t('common.unknownExercise')
      },
      modeOf: (id: string): ExerciseMode => byId(id)?.mode ?? 'reps',
      set,
      /** Several sets on one line: "3 sets of 60 kg × 8" when they match, else "60 kg × 8 · 55 kg × 10". */
      setList: (sets: Pick<LoggedSet, 'weight' | 'reps' | 'sec'>[], mode: ExerciseMode) => {
        const parts = sets.map((s) => set(s, mode))
        if (parts.length > 1 && parts.every((p) => p === parts[0])) return t('app.w.lastSame', { set: parts[0]!, n: fmtNumber(parts.length, lang) })
        return parts.slice(0, 4).join(' · ')
      },
      /** A program or day name; ready-plan names follow the language. */
      planName: (name: string) => {
        const l10n = TEMPLATE_NAMES.get(name)
        return l10n ? pick(l10n, lang) : name
      },
      sessionName: (s: Pick<WorkoutSession, 'name'>) => (s.name ? (TEMPLATE_NAMES.has(s.name) ? pick(TEMPLATE_NAMES.get(s.name)!, lang) : s.name) : t('common.quickWorkout')),
      /** "A, B and C" / «أ وب وج», per language. */
      list: (items: string[]) => new Intl.ListFormat(lang === 'ar' ? 'ar' : 'en', { type: 'conjunction' }).format(items),
    }
  }, [t, lang, unit, byId])
}

/** What the user owns at home, stable between renders until it changes. */
export function useHomeGear(): HomeGear {
  return useSettings(useShallow((s) => ({ homeEquipment: s.homeEquipment, homeAccessories: s.homeAccessories })))
}

/** What load suggestions know about the person: latest body weight, height, background, unit. */
export function useBodyProfile(): BodyProfile {
  const weights = useBodyWeights()
  const { heightCm, level, unit } = useSettings(useShallow((s) => ({ heightCm: s.heightCm, level: s.level, unit: s.unit })))
  const kg = weights?.at(-1)?.kg ?? null
  return useMemo(() => ({ kg, heightCm, level, unit }), [kg, heightCm, level, unit])
}
