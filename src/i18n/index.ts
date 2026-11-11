import { useCallback } from 'react'
import { useSettings } from '@/store/settings'
import type { L10n, Lang } from '@/types'
import common from './dict/common'
import onboarding from './dict/onboarding'
import today from './dict/today'
import library from './dict/library'
import programs from './dict/programs'
import workout from './dict/workout'
import progress from './dict/progress'
import settings from './dict/settings'
import motion from './dict/motion'
import safety from './dict/safety'
import body from './dict/body'

/**
 * UI strings. Each dictionary file holds both languages side by side so a key can never exist
 * in one language only:
 *
 *   export default { 'today.start': { ar: 'ابدأ التمرين', en: 'Start workout' } } satisfies Dict
 *
 * One file per screen area (each owned by whoever builds that area). Keys are prefixed with
 * the file name. Placeholders use {name}: t('workout.setOf', { n: 2, total: 4 }).
 */
export type Dict = Record<string, L10n>

const DICT = {
  ...common,
  ...onboarding,
  ...today,
  ...library,
  ...programs,
  ...workout,
  ...progress,
  ...settings,
  ...motion,
  ...safety,
  ...body,
}

export type TKey = keyof typeof DICT
export type TParams = Record<string, string | number>
export type TFn = (key: TKey, params?: TParams) => string

export function translate(lang: Lang, key: TKey, params?: TParams): string {
  const entry: L10n | undefined = DICT[key]
  let text = entry ? entry[lang] || entry.en : key
  if (params) {
    for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v))
  }
  return text
}

/** `const t = useT()` → `t('common.save')`. Re-renders when the language changes. */
export function useT(): TFn {
  const lang = useSettings((s) => s.lang)
  return useCallback((key, params) => translate(lang, key, params), [lang])
}

export function useLang(): Lang {
  return useSettings((s) => s.lang)
}

/** Pick the right side of a bilingual value (exercise names, program names…). */
export function pick(value: L10n, lang: Lang): string {
  return value[lang] || value.en
}

export function dirOf(lang: Lang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr'
}
