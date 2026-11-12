import { PROGRAM_TEMPLATES } from '@/data/catalog'
import type { Level, Place, ProgramTemplate } from '@/types'
import type { HomeGear } from './place'

/** The ready plan to start with for a place, the user's home gear and level. */
export function recommendTemplate(place: Place, gear: HomeGear, level: Level): ProgramTemplate | undefined {
  const dumbbells = gear.homeEquipment.includes('dumbbell')
  const home = { beginner: dumbbells ? 'home-dumbbell' : 'home-starter', intermediate: dumbbells ? 'home-dumbbell-plus' : 'home', advanced: 'home-advanced' }
  const gym = { beginner: 'fullbody', intermediate: 'upperlower', advanced: 'gym-advanced' }
  const id = (place === 'home' ? home : gym)[level]
  return PROGRAM_TEMPLATES.find((template) => template.id === id) ?? PROGRAM_TEMPLATES.find((template) => template.place === place)
}
