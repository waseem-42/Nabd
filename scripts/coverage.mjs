// Animated exercises available per muscle group at each place (the Phase 2 target is 3+ everywhere).
// Usage: node scripts/coverage.mjs
import fs from 'node:fs'

const exercises = JSON.parse(fs.readFileSync('src/data/exercises.json', 'utf8'))
const engine = fs.readFileSync('src/motion/engine.ts', 'utf8').split('WARMUP_RIGS')[0]
const animated = new Set([...engine.matchAll(/definition\('[^']+','([^']+)'/g)].map((m) => m[1]))
const GROUP = {
  chest: 'chest', back: 'back', lowerback: 'back', trapezius: 'back', shoulders: 'shoulders',
  biceps: 'arms', triceps: 'arms', forearm: 'arms', quads: 'legs', hamstrings: 'legs', glutes: 'legs',
  calves: 'legs', abdomen: 'core', obliques: 'core',
}
// Same rule as fitsPlace(): home gear = dumbbells, a bench and a pull-up bar.
const places = {
  'home, no gear': (e) => e.equipment === 'bodyweight' && e.needs.length === 0,
  'home, with gear': (e) => ['bodyweight', 'dumbbell'].includes(e.equipment),
  gym: () => true,
}
const rows = {}
for (const e of exercises) {
  if (!animated.has(e.id)) continue
  const row = (rows[GROUP[e.primary]] ??= Object.fromEntries(Object.keys(places).map((p) => [p, 0])))
  for (const [place, fits] of Object.entries(places)) if (fits(e)) row[place]++
}
console.log(`${animated.size} animated exercises`)
console.table(rows)
const gaps = Object.entries(rows).flatMap(([g, r]) => Object.entries(r).filter(([, n]) => n < 3).map(([p, n]) => `${g} @ ${p}: ${n}`))
console.log(gaps.length ? `Below 3: ${gaps.join(', ')}` : 'Every cell has 3 or more.')
