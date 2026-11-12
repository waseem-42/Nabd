import { describe, expect, it } from 'vitest'
import { EXERCISES, EXERCISE_BY_ID } from '@/data/catalog'
import { RIGS } from '@/motion/engine'
import { ex } from './testFixtures'
import { EXERCISE_SAFETY, exerciseStepsFor, safetyFor } from './safety'

describe('exercise safety guidance', () => {
  it('includes the pulldown return and avoids forcing curl height or press lockout', () => {
    for(const lang of ['ar','en'] as const){
      const pulldown=EXERCISE_BY_ID.get('RVwzP10')!
      expect(exerciseStepsFor(pulldown,lang)).toHaveLength(pulldown.steps[lang].length+1)
      expect(exerciseStepsFor(pulldown,lang).at(-1)).toContain(lang==='ar'?'بتحكم':'control')
      for(const id of ['NbVPDMW','3d7wHyd']){
        const exercise=EXERCISE_BY_ID.get(id)!
        expect(exerciseStepsFor(exercise,lang)[2]).not.toEqual(exercise.steps[lang][2])
        expect(exerciseStepsFor({...exercise,id:'different'},lang)).toEqual(exercise.steps[lang])
      }
    }
  })
  it('gives every catalogue activity bilingual guidance without claiming a technique review', () => {
    for (const exercise of EXERCISES) {
      const result = safetyFor(exercise)
      expect(result.cues.length).toBeGreaterThanOrEqual(2)
      for (const cue of result.cues) { expect(cue.ar).toBeTruthy(); expect(cue.en).toBeTruthy() }
      expect(result.specific).toBe(Object.hasOwn(EXERCISE_SAFETY, exercise.id))
    }
  })

  it('maps exact cues to every supported variant, never a shared illustration slug', () => {
    expect(Object.keys(EXERCISE_SAFETY).sort()).toEqual(RIGS.map(r => r.exerciseId).sort())
    for (const rig of RIGS) expect(EXERCISE_BY_ID.has(rig.exerciseId)).toBe(true)
    expect(safetyFor(ex('other', { art: 'bodyweight-squat' })).specific).toBe(false)
  })

  it('replaces fixed depths, stance distance and bench angle without modifying source steps', () => {
    for (const id of ['6YUfHPL', '9E25EOx', 'glute-bridge', 'SpYC0Kp']) {
      const exercise = EXERCISE_BY_ID.get(id)!
      const original = structuredClone(exercise.steps)
      for (const lang of ['ar', 'en'] as const) {
        const steps = exerciseStepsFor(exercise, lang)
        expect(steps.length).toBe(exercise.steps[lang].length || exercise.steps.en.length)
        expect(steps).not.toEqual(original[lang])
        expect(steps.every(Boolean)).toBe(true)
      }
      expect(exerciseStepsFor(exercise, 'en').join(' ')).not.toMatch(/two feet|90-degree|vertebra|thighs are parallel/)
      expect(exercise.steps).toEqual(original)
    }
  })
})
