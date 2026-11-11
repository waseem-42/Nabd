import {
  MUSCLE_TO_GROUP,
  type Exercise,
  type ExerciseLookup,
  type Place,
  type ProgramTemplate,
  type RoutineItem,
  type Settings,
} from '@/types'

/** What the user owns at home (the gym is assumed to have everything). */
export type HomeGear = Pick<Settings, 'homeEquipment' | 'homeAccessories'>
/**
 * Gym: everything fits. Home: the equipment must be bodyweight or something the user owns,
 * and every accessory it needs (bench, pull-up bar) must be owned too.
 */
export function fitsPlace(exercise: Exercise, place: Place, gear: HomeGear): boolean {
  if (place === 'gym') return true
  const hasEquipment = exercise.equipment === 'bodyweight' || gear.homeEquipment.includes(exercise.equipment)
  return hasEquipment && exercise.needs.every((a) => gear.homeAccessories.includes(a))
}

export function filterForPlace(exercises: Exercise[], place: Place, gear: HomeGear): Exercise[] {
  return exercises.filter((e) => fitsPlace(e, place, gear))
}

export interface PlaceFit {
  fits: boolean
  /** Exercise ids (unique, in order) that cannot be done here; unknown ids count as missing. */
  missing: string[]
}

export function routineFit(
  routine: { items: RoutineItem[] },
  place: Place,
  gear: HomeGear,
  lookup: ExerciseLookup,
): PlaceFit {
  return itemsFit(routine.items, place, gear, lookup)
}

/** Fit of all days of a bundled template together. */
export function templateFit(template: ProgramTemplate, place: Place, gear: HomeGear, lookup: ExerciseLookup): PlaceFit {
  return itemsFit(template.days.flatMap((d) => d.items), place, gear, lookup)
}

function itemsFit(items: RoutineItem[], place: Place, gear: HomeGear, lookup: ExerciseLookup): PlaceFit {
  const missing = new Set<string>()
  for (const { exerciseId } of items) {
    const ex = lookup(exerciseId)
    if (!ex || !fitsPlace(ex, place, gear)) missing.add(exerciseId)
  }
  return { fits: missing.size === 0, missing: [...missing] }
}

export interface AlternativeOptions {
  /** Ids never to suggest — typically the exercises already in the session. */
  exclude?: Iterable<string>
  /** Default 10. */
  limit?: number
}

const LEVELS = ['beginner', 'intermediate', 'advanced'] as const

/**
 * Exercises that can replace `exercise` at this place, best first. Candidates must fit the
 * place and share the mode (a timed hold never replaces a rep exercise). Same primary muscle
 * ranks first, then same muscle group or a muscle the original also works; within a tier,
 * same kind, a close level and shared secondary muscles score higher.
 */
export function alternativesFor(
  exercise: Exercise,
  all: Exercise[],
  place: Place,
  gear: HomeGear,
  { exclude = [], limit = 10 }: AlternativeOptions = {},
): Exercise[] {
  const excluded = new Set(exclude)
  excluded.add(exercise.id)
  const group = MUSCLE_TO_GROUP[exercise.primary]

  const tierOf = (c: Exercise): number | null => {
    if (c.primary === exercise.primary) return 0
    if (MUSCLE_TO_GROUP[c.primary] === group || exercise.secondary.includes(c.primary)) return 1
    return null
  }
  const scoreOf = (c: Exercise): number => {
    const levelGap = Math.abs(LEVELS.indexOf(c.level) - LEVELS.indexOf(exercise.level))
    const overlap = c.secondary.filter((m) => exercise.secondary.includes(m)).length
    return (c.kind === exercise.kind ? 3 : 0) + (2 - levelGap) + overlap
  }

  const ranked: { ex: Exercise; tier: number; score: number }[] = []
  for (const c of all) {
    if (excluded.has(c.id) || c.mode !== exercise.mode || !fitsPlace(c, place, gear)) continue
    const tier = tierOf(c)
    if (tier !== null) ranked.push({ ex: c, tier, score: scoreOf(c) })
  }
  ranked.sort((a, b) => a.tier - b.tier || b.score - a.score || a.ex.name.en.localeCompare(b.ex.name.en))
  return ranked.slice(0, limit).map((r) => r.ex)
}
