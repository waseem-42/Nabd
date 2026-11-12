import { describe, expect, it } from 'vitest'
import type { L10n } from '@/types'
import app from './dict/app'
import body from './dict/body'
import common from './dict/common'
import library from './dict/library'
import motion from './dict/motion'
import onboarding from './dict/onboarding'
import programs from './dict/programs'
import progress from './dict/progress'
import safety from './dict/safety'
import settings from './dict/settings'
import today from './dict/today'
import workout from './dict/workout'

const FILES: Record<string, Record<string, L10n>> = { app, body, common, library, motion, onboarding, programs, progress, safety, settings, today, workout }
const entries = Object.entries(FILES).flatMap(([file, dict]) => Object.entries(dict).map(([key, value]) => ({ file, key, value })))
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('UI strings', () => {
  it('never defines a key twice (a later file would silently win)', () => {
    const seen = new Map<string, string>()
    for (const { file, key } of entries) {
      expect(seen.get(key), `${key} is in ${seen.get(key)} and ${file}`).toBeUndefined()
      seen.set(key, file)
    }
  })

  it('has both languages for every string, with the same placeholders', () => {
    for (const { key, value } of entries) {
      expect(value.ar.trim(), `${key}: Arabic is empty`).not.toBe('')
      expect(value.en.trim(), `${key}: English is empty`).not.toBe('')
      expect(placeholders(value.ar), `${key}: placeholders differ`).toEqual(placeholders(value.en))
    }
  })

  it('really is Arabic on the Arabic side', () => {
    for (const { key, value } of entries) {
      if (/[A-Za-z]{3}/.test(value.en.replace(/\{\w+\}/g, ''))) expect(/[؀-ۿ]/.test(value.ar), `${key}: "${value.ar}"`).toBe(true)
    }
  })
})
