import type { Equipment, Exercise, Level, LoggedSet, Muscle, Unit } from '@/types'

/*
 * Load suggestions that use what the app knows about the person: body weight, height,
 * training background and the weight unit they load in. Everything here is a *starting
 * point* shown with an explanation — the user edits any number before lifting it.
 *
 * Ratios are deliberately conservative first-session loads (fractions of body weight for
 * someone new to the lift), not strength standards or maximums.
 */

export interface BodyProfile {
  /** Latest logged body weight in kg; null when the user hasn't entered one. */
  kg: number | null
  heightCm: number | null
  level: Level
  unit: Unit
}

const LB_PER_KG = 2.2046226218

// ── What kind of movement is it? ────────────────────────────────────────────────────────────

/** Movements where "weight" is not resistance (assistance machines) or too varied to guess. */
const NO_GUESS = /assisted|captain|back extension|hyperextension|swim bench|woodchop|pallof|internal rotation|arm circles|russian twist|side bend|crunch|sit-up|knee raise/

const ISOLATION = /curl|raise|fly|crossover|pec deck|extension|kickback|pushdown|shrug|calf|abduction|adduction|face pull|pullover|reverse fly|rear delt|upright row|skull|tate/

type Rule = [RegExp, number]

/** First matching rule wins. Dumbbell / kettlebell ratios are per hand. */
const RATIOS: Partial<Record<Equipment, { rules: Rule[]; fallback: number }>> = {
  barbell: {
    rules: [
      [/romanian|good morning|stiff/, 0.4],
      [/deadlift/, 0.6],
      [/hip thrust|glute bridge/, 0.5],
      [/squat|lunge|split/, 0.45],
      [/military|overhead|shoulder press|push press|standing.*press/, 0.25],
      [/bench|press/, 0.4],
      [/row/, 0.35],
      [/shrug|calf/, 0.4],
      [/curl/, 0.15],
      [/triceps|skull|extension|pullover/, 0.12],
    ],
    fallback: 0.2,
  },
  dumbbell: {
    rules: [
      [/shoulder|overhead|arnold|military/, 0.08],
      [/bench|chest press|close grip press|hammer press|press/, 0.12],
      [/hip thrust|glute bridge/, 0.15],
      [/shrug/, 0.12],
      [/row/, 0.1],
      [/squat|lunge|step-up|deadlift|split|calf/, 0.1],
      [/fly|pullover|leg curl/, 0.05],
      [/curl/, 0.05],
      [/raise/, 0.03],
      [/triceps|extension|kickback|skull|tate/, 0.04],
    ],
    fallback: 0.06,
  },
  machine: {
    rules: [
      [/leg press/, 0.8],
      [/hip thrust/, 0.5],
      [/squat/, 0.4],
      [/shrug|calf/, 0.4],
      [/romanian|good morning/, 0.35],
      [/row/, 0.3],
      [/shoulder press/, 0.2],
      [/press/, 0.3],
      [/adduction|abduction/, 0.25],
      [/leg extension|leg curl/, 0.2],
      [/split|lunge/, 0.2],
      [/triceps|upright row/, 0.15],
      [/pec deck|reverse fly|curl/, 0.12],
      [/raise/, 0.08],
    ],
    fallback: 0.2,
  },
  cable: {
    rules: [
      [/pulldown/, 0.35],
      [/row/, 0.3],
      [/shrug/, 0.3],
      [/pull through/, 0.2],
      [/pushdown|triceps|extension/, 0.12],
      [/curl|upright/, 0.1],
      [/fly|crossover/, 0.07],
      [/raise|face pull|reverse fly|rear delt|hip/, 0.05],
    ],
    fallback: 0.1,
  },
  kettlebell: {
    rules: [
      [/swing|squat|deadlift/, 0.16],
      [/row/, 0.12],
      [/press|lunge/, 0.1],
    ],
    fallback: 0.1,
  },
}

const LEVEL_FACTOR: Record<Level, number> = { beginner: 1, intermediate: 1.4, advanced: 1.8 }

const nameOf = (exercise: Pick<Exercise, 'name'>) => exercise.name.en.toLowerCase()

export function isIsolation(exercise: Pick<Exercise, 'name'>): boolean {
  return ISOLATION.test(nameOf(exercise))
}

// ── Rounding to what can actually be loaded ────────────────────────────────────────────────

/** Smallest jump and lightest load per equipment, in kg and in lb. */
const STEPS: Partial<Record<Equipment, { kg: [step: number, min: number]; lb: [step: number, min: number] }>> = {
  barbell: { kg: [2.5, 20], lb: [5, 45] },
  dumbbell: { kg: [2, 2], lb: [5, 5] },
  machine: { kg: [2.5, 5], lb: [5, 10] },
  cable: { kg: [2.5, 2.5], lb: [5, 5] },
  kettlebell: { kg: [4, 4], lb: [5, 10] },
  weighted: { kg: [2.5, 2.5], lb: [5, 5] },
}

/** Rounds a load (kg) to the nearest loadable step in the user's unit; returns kg. */
export function roundLoad(kg: number, equipment: Equipment, unit: Unit, mode: 'nearest' | 'down' = 'nearest'): number {
  const steps = STEPS[equipment]
  if (!steps || !(kg > 0)) return Math.max(0, kg)
  const [step, min] = steps[unit]
  const value = unit === 'lb' ? kg * LB_PER_KG : kg
  const fn = mode === 'down' ? Math.floor : Math.round
  const rounded = Math.max(min, fn(value / step + 1e-9) * step)
  const back = unit === 'lb' ? rounded / LB_PER_KG : rounded
  return Math.round(back * 1000) / 1000
}

/** The jump used when progressing a weighted exercise, in kg. */
export function loadIncrement(equipment: Equipment, unit: Unit): number {
  const steps = STEPS[equipment]
  if (!steps) return 0
  const step = steps[unit][0]
  return unit === 'lb' ? step / LB_PER_KG : step
}

// ── Suggestions ─────────────────────────────────────────────────────────────────────────────

/**
 * First-session working weight (kg) for an exercise never logged before, scaled from body
 * weight and background. null when the profile has no weight or the lift can't be guessed.
 */
export function suggestStartWeight(exercise: Exercise, profile: BodyProfile | undefined): number | null {
  if (!profile?.kg || exercise.mode !== 'reps') return null
  const table = RATIOS[exercise.equipment]
  const name = nameOf(exercise)
  if (!table || NO_GUESS.test(name)) return null
  const ratio = table.rules.find(([re]) => re.test(name))?.[1] ?? table.fallback
  return roundLoad(profile.kg * ratio * LEVEL_FACTOR[profile.level], exercise.equipment, profile.unit)
}

/**
 * Ramp-up sets before a working weight — lighter, fewer reps, so the joints and the groove
 * are ready without tiring the muscle. Empty when the load is too light to need one.
 */
export function warmupSets(workKg: number, equipment: Equipment, unit: Unit): LoggedSet[] {
  const plan: [pct: number, reps: number][] = []
  let bar = 0
  if (equipment === 'barbell') {
    bar = roundLoad(20, 'barbell', unit)
    if (workKg < bar + 10) return []
    if (workKg < 60) plan.push([0, 10], [0.6, 5])
    else if (workKg < 100) plan.push([0, 10], [0.5, 5], [0.75, 3])
    else plan.push([0, 10], [0.4, 5], [0.6, 3], [0.8, 2])
  } else {
    const floor: Partial<Record<Equipment, number>> = { dumbbell: 8, kettlebell: 12, machine: 20, cable: 15 }
    const min = floor[equipment]
    if (min === undefined || workKg < min) return []
    if (workKg < min * 2.5) plan.push([0.55, 10])
    else plan.push([0.5, 10], [0.75, 5])
  }
  const sets: LoggedSet[] = []
  let previous = 0
  for (const [pct, reps] of plan) {
    const kg = pct === 0 ? bar : roundLoad(workKg * pct, equipment, unit, 'down')
    if (kg <= previous || kg >= workKg) continue
    sets.push({ weight: kg, reps, kind: 'warmup', done: false })
    previous = kg
  }
  return sets
}

/** Whether an exercise should get automatic ramp-up sets (heavy compound, weighted). */
export function wantsWarmup(exercise: Exercise): boolean {
  return exercise.mode === 'reps' && exercise.equipment in STEPS && exercise.equipment !== 'weighted' && !isIsolation(exercise) && !NO_GUESS.test(nameOf(exercise))
}

/**
 * Double progression: when every work set last time reached the target reps, add one
 * loadable step (or, for bodyweight, one rep). Returns null when it's not time yet.
 */
export function progressSets(
  last: LoggedSet[],
  exercise: Exercise,
  targetReps: number | undefined,
  unit: Unit,
): LoggedSet[] | null {
  if (exercise.mode !== 'reps' || !last.length) return null
  const goal = targetReps ?? 12
  if (!last.every((s) => s.reps >= goal)) return null
  const step = loadIncrement(exercise.equipment, unit)
  const weighted = last.some((s) => s.weight > 0)
  if (weighted && step > 0) {
    return last.map((s) => ({ ...s, weight: roundLoad(s.weight + step, exercise.equipment, unit), reps: targetReps ?? s.reps }))
  }
  if (!weighted) return last.map((s) => ({ ...s, reps: s.reps + 1 }))
  return null
}

/**
 * Share of body weight moved in common bodyweight lifts (published force-plate estimates,
 * rounded). Used to show the real load of a push-up or pull-up; null when unknown.
 */
export function bodyweightShare(exercise: Pick<Exercise, 'name' | 'equipment'>): number | null {
  if (exercise.equipment !== 'bodyweight' && exercise.equipment !== 'weighted') return null
  const name = nameOf(exercise)
  if (/knee push|incline push|wall push/.test(name)) return /wall/.test(name) ? 0.3 : 0.5
  if (/push-?up/.test(name) && !/pike|handstand|scapular/.test(name)) return 0.65
  if (/pull-?up|chin-?up/.test(name) && !/negative|scapular/.test(name)) return 1
  if (/dip/.test(name) && !/bench|hip/.test(name)) return 0.9
  if (/inverted row/.test(name)) return 0.55
  return null
}

// ── Body ────────────────────────────────────────────────────────────────────────────────────

export function bmi(profile: Pick<BodyProfile, 'kg' | 'heightCm'>): number | null {
  if (!profile.kg || !profile.heightCm) return null
  const m = profile.heightCm / 100
  return Math.round((profile.kg / (m * m)) * 10) / 10
}

/** Prefer joint-friendly warm-ups (no jumping) for higher body mass. */
export function prefersLowImpact(profile: Pick<BodyProfile, 'kg' | 'heightCm'> | undefined): boolean {
  if (!profile?.kg) return false
  const value = bmi(profile)
  return value !== null ? value >= 30 : profile.kg >= 110
}

export type WarmupArea = 'upper' | 'lower' | 'core'
export type WarmupMove =
  | 'march' | 'jog' | 'armCircles' | 'scapPushup' | 'bandPullApart' | 'bwSquat' | 'legSwings'
  | 'hipOpener' | 'catCow' | 'deadBug'

export interface WarmupItem {
  move: WarmupMove
  /** Seconds, or reps when `reps` is true. */
  amount: number
  reps?: boolean
}

const UPPER: Muscle[] = ['chest', 'shoulders', 'biceps', 'triceps', 'forearm', 'trapezius', 'back']
const LOWER: Muscle[] = ['glutes', 'quads', 'hamstrings', 'calves', 'lowerback']

export function areasOf(muscles: Muscle[]): WarmupArea[] {
  const areas = new Set<WarmupArea>()
  for (const m of muscles) areas.add(UPPER.includes(m) ? 'upper' : LOWER.includes(m) ? 'lower' : 'core')
  return (['upper', 'lower', 'core'] as const).filter((a) => areas.has(a))
}

/**
 * A short general warm-up for today's session: raise the pulse, then move the areas that
 * will work. Longer for beginners and heavy days; no jumping for a joint-friendly profile.
 */
export function warmupRoutine(muscles: Muscle[], profile: BodyProfile | undefined, heavy: boolean): WarmupItem[] {
  const lowImpact = prefersLowImpact(profile)
  const pulse = (profile?.level ?? 'beginner') === 'beginner' || heavy ? 180 : 120
  const items: WarmupItem[] = [{ move: lowImpact ? 'march' : 'jog', amount: pulse }]
  const areas = areasOf(muscles)
  if (!areas.length) areas.push('upper', 'lower')
  if (areas.includes('upper')) items.push({ move: 'armCircles', amount: 30 }, { move: lowImpact ? 'bandPullApart' : 'scapPushup', amount: 10, reps: true })
  if (areas.includes('lower')) items.push({ move: 'bwSquat', amount: 10, reps: true }, { move: lowImpact ? 'hipOpener' : 'legSwings', amount: 10, reps: true })
  if (areas.includes('core') || heavy) items.push({ move: lowImpact ? 'catCow' : 'deadBug', amount: 8, reps: true })
  return items
}

export function warmupMinutes(items: WarmupItem[]): number {
  // Reps take ~3 s each plus a moment to switch.
  const sec = items.reduce((sum, i) => sum + (i.reps ? i.amount * 3 : i.amount) + 10, 0)
  return Math.max(3, Math.round(sec / 60))
}

// ── Plates ──────────────────────────────────────────────────────────────────────────────────

const PLATES = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] }

/**
 * Plates per side for a barbell load, heaviest first (in the user's unit). `rest` is what
 * couldn't be matched with standard plates (0 when exact). null below the empty bar.
 */
export function platesPerSide(totalKg: number, unit: Unit): { bar: number; plates: number[]; rest: number } | null {
  const bar = unit === 'kg' ? 20 : 45
  const total = Math.round((unit === 'lb' ? totalKg * LB_PER_KG : totalKg) * 100) / 100
  if (total < bar) return null
  let side = (total - bar) / 2
  const plates: number[] = []
  for (const p of PLATES[unit]) {
    while (side >= p - 1e-6) {
      plates.push(p)
      side -= p
    }
  }
  return { bar, plates, rest: Math.round(side * 2 * 100) / 100 }
}
