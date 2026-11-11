import type { Lang, Unit } from '@/types'

/**
 * Arabic UI keeps Latin digits (0-9): weights and reps are read at a glance mid-set, and
 * mixing digit systems inside one screen hurts that. Same choice as openGym.
 */
export function localeOf(lang: Lang): string {
  return lang === 'ar' ? 'ar-u-nu-latn' : 'en'
}

const KG_PER_LB = 0.45359237

export function kgToUnit(kg: number, unit: Unit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB
}

export function unitToKg(value: number, unit: Unit): number {
  return unit === 'kg' ? value : value * KG_PER_LB
}

/** Weight for display in the user's unit, without the unit label: 62.5 → "62.5", 60 → "60". */
export function fmtWeight(kg: number, unit: Unit, lang: Lang): string {
  const v = kgToUnit(kg, unit)
  const rounded = Math.round(v * 10) / 10
  return new Intl.NumberFormat(localeOf(lang), { maximumFractionDigits: 1 }).format(rounded)
}

export function fmtNumber(n: number, lang: Lang, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(localeOf(lang), { maximumFractionDigits }).format(n)
}

/** Seconds → "1:30" (timers, rest). Always Latin digits, never localised separators. */
export function fmtClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m)
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`
}

export function fmtDate(ts: number | Date, lang: Lang, style: 'short' | 'long' = 'short'): string {
  const opts: Intl.DateTimeFormatOptions =
    style === 'long'
      ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
      : { weekday: 'short', day: 'numeric', month: 'short' }
  return new Intl.DateTimeFormat(localeOf(lang), opts).format(ts)
}

/** Local calendar day as 'YYYY-MM-DD'. */
export function isoDay(ts: number | Date = Date.now()): string {
  const d = new Date(ts)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function uid(): string {
  return crypto.randomUUID()
}
