import { PROGRAM_TEMPLATES } from '@/data/catalog'
import type { Level, Place, ProgramTemplate } from '@/types'
import type { HomeGear } from './place'

/** The ready plan to start with for a place, the user's home gear and level. */
export function recommendTemplate(place: Place, gear: HomeGear, level: Level): ProgramTemplate | undefined {
  const id = place === 'home'
    ? gear.homeEquipment.includes('dumbbell') ? 'home-dumbbell' : level === 'beginner' ? 'home-starter' : 'home'
    : level === 'beginner' ? 'fullbody' : 'upperlower'
  return PROGRAM_TEMPLATES.find((template) => template.id === id) ?? PROGRAM_TEMPLATES.find((template) => template.place === place)
}
