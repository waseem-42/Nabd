import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { EXERCISES } from '@/data/catalog'
import { SPORT_SYMBOLS } from '@/ui/ActivitySymbol'
import { EXERCISE_VISUAL_STYLE, poseSequence } from './exerciseVisuals'

describe('approved technical catalogue', () => {
  it('covers every bundled entry with its own source art or an explicit activity symbol', () => {
    expect(EXERCISE_VISUAL_STYLE).toBe('technical')
    for(const exercise of EXERCISES) {
      if(exercise.art)expect(existsSync(resolve(`public/art/${exercise.art}.json`)),exercise.id).toBe(true)
      else expect(SPORT_SYMBOLS[exercise.id],exercise.id).toBeTruthy()
    }
    for(const slug of new Set(EXERCISES.flatMap(exercise=>exercise.art?[exercise.art]:[]))) {
      const art=JSON.parse(readFileSync(resolve(`public/art/${slug}.json`),'utf8'))
      expect(art.frames.length,slug).toBeGreaterThan(0)
      expect(art.viewBox,slug).toHaveLength(4)
      expect(art.viewBox.every(Number.isFinite),slug).toBe(true)
    }
  })
  it('returns through intermediate poses instead of jumping from the final pose to the first', () => {
    expect(poseSequence(3)).toEqual([0,1,2,1])
    expect(poseSequence(4)).toEqual([0,1,2,3,2,1])
    expect(poseSequence(2)).toEqual([0,1])
    expect(poseSequence(1)).toEqual([0])
    expect(poseSequence(0)).toEqual([])
  })
})
