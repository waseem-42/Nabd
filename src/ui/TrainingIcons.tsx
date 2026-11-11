import type { ReactNode } from 'react'
import type { Accessory, Equipment, Muscle, MuscleGroup } from '@/types'
import { cx } from './cx'

/*
 * Original training icons. Muscles are a tiny body map (front or back view) with the target
 * area lit in the accent colour; equipment icons share Lucide's 24px / 2px stroke grammar so
 * they sit next to the rest of the UI. Purely decorative: the label always carries the meaning.
 */

type Region =
  | 'head' | 'delts' | 'chest' | 'abs' | 'obliques' | 'biceps' | 'forearms' | 'quads' | 'shins' | 'hips'
  | 'traps' | 'lats' | 'lowerback' | 'triceps' | 'glutes' | 'hamstrings' | 'calves'

const MUSCLE_VIEW: Record<Muscle, { back: boolean; lit: Region[] }> = {
  chest: { back: false, lit: ['chest'] },
  shoulders: { back: false, lit: ['delts'] },
  biceps: { back: false, lit: ['biceps'] },
  forearm: { back: false, lit: ['forearms'] },
  abdomen: { back: false, lit: ['abs'] },
  obliques: { back: false, lit: ['obliques'] },
  quads: { back: false, lit: ['quads'] },
  triceps: { back: true, lit: ['triceps'] },
  trapezius: { back: true, lit: ['traps'] },
  back: { back: true, lit: ['lats'] },
  lowerback: { back: true, lit: ['lowerback'] },
  glutes: { back: true, lit: ['glutes'] },
  hamstrings: { back: true, lit: ['hamstrings'] },
  calves: { back: true, lit: ['calves'] },
}

const GROUP_VIEW: Record<MuscleGroup, { back: boolean; lit: Region[] }> = {
  chest: { back: false, lit: ['chest'] },
  shoulders: { back: false, lit: ['delts'] },
  arms: { back: false, lit: ['biceps', 'forearms'] },
  core: { back: false, lit: ['abs', 'obliques'] },
  legs: { back: false, lit: ['quads', 'shins'] },
  back: { back: true, lit: ['lats', 'traps', 'lowerback'] },
}

/** Both sides of the body: [left, right] mirrored around x = 10. */
const pair = (node: (x: number, flip: 1 | -1) => ReactNode) => [node(0, 1), node(20, -1)]

function shapes(back: boolean): Record<Region, ReactNode> {
  const ell = (cx: number, cy: number, rx: number, ry: number, rot = 0) => (x: number, flip: 1 | -1) => (
    <ellipse key={`${cx}-${x}`} cx={x + flip * cx} cy={cy} rx={rx} ry={ry} transform={rot ? `rotate(${flip * rot} ${x + flip * cx} ${cy})` : undefined} />
  )
  const common = {
    head: <circle cx={10} cy={2.9} r={2.1} />,
    hips: <rect x={7.1} y={15.1} width={5.8} height={1.6} rx={0.8} />,
    shins: <>{pair(ell(8, 24.8, 0.95, 2.5))}</>,
    delts: <>{pair(ell(5.1, 7.3, 1.55, 1.45))}</>,
    forearms: <>{pair(ell(3.65, 14.6, 0.85, 2.1, 6))}</>,
  }
  if (!back) {
    return {
      ...common,
      chest: <>{pair(ell(8.05, 8.7, 1.85, 1.45))}</>,
      abs: <rect x={8.6} y={10.5} width={2.8} height={4.4} rx={1} />,
      obliques: <>{pair((x, f) => <rect key={x} x={f === 1 ? 6.7 : 20 - 6.7 - 1.6} y={10.7} width={1.6} height={3.9} rx={0.8} />)}</>,
      biceps: <>{pair(ell(4.35, 10.4, 1, 2, 8))}</>,
      quads: <>{pair(ell(8.15, 19.4, 1.5, 3.3))}</>,
      traps: null, lats: null, lowerback: null, triceps: null, glutes: null, hamstrings: null, calves: null,
    }
  }
  return {
    ...common,
    traps: <path d="M8 5.6h4l1.6 1.5L10 9.6 6.4 7.1Z" />,
    lats: <>{pair(ell(7.75, 10.9, 1.7, 2.6, -8))}</>,
    lowerback: <rect x={8.75} y={12.6} width={2.5} height={2.4} rx={0.9} />,
    triceps: <>{pair(ell(4.35, 10.4, 1, 2, 8))}</>,
    glutes: <>{pair(ell(8.45, 16.9, 1.65, 1.45))}</>,
    hamstrings: <>{pair(ell(8.15, 20.2, 1.4, 2.6))}</>,
    calves: <>{pair(ell(8, 24.5, 1.1, 2.3))}</>,
    chest: null, abs: null, obliques: null, biceps: null, quads: null,
  }
}

function BodyMap({ back, lit, className }: { back: boolean; lit: Region[]; className?: string }) {
  const all = shapes(back)
  const regions = Object.keys(all) as Region[]
  return (
    <svg viewBox="0 0 20 28" className={cx('h-7 w-auto shrink-0', className)} aria-hidden data-body-view={back ? 'back' : 'front'}>
      <g fill="currentColor" opacity={0.3}>
        {regions.filter((r) => !lit.includes(r)).map((r) => <g key={r}>{all[r]}</g>)}
      </g>
      <g fill="var(--color-accent)">
        {lit.map((r) => <g key={r}>{all[r]}</g>)}
      </g>
    </svg>
  )
}

export function MuscleIcon({ muscle, className }: { muscle: Muscle; className?: string }) {
  const view = MUSCLE_VIEW[muscle]
  return <BodyMap back={view.back} lit={view.lit} className={className} />
}

export function MuscleGroupIcon({ group, className }: { group: MuscleGroup; className?: string }) {
  const view = GROUP_VIEW[group]
  return <BodyMap back={view.back} lit={view.lit} className={className} />
}

// ── Equipment ───────────────────────────────────────────────────────────────────────────────

const EQUIPMENT_PATHS: Record<Equipment | Accessory, ReactNode> = {
  bodyweight: (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M5 9.5 12 8l7 1.5M12 8v6.5M12 14.5 9 21M12 14.5l3 6.5" />
    </>
  ),
  dumbbell: <path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11" />,
  barbell: <path d="M2 12h20M5.5 6.5v11M8 8.5v7M18.5 6.5v11M16 8.5v7" />,
  machine: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M12 3v7M8.5 13h7M8.5 16h7M8.5 19h7" />
    </>
  ),
  cable: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <path d="M12 7.5V15M12 15l-4.5 4M12 15l4.5 4M6 19h12" />
    </>
  ),
  band: <path d="M4 7c2.7-2.7 5.3 2.7 8 0s5.3 2.7 8 0M4 17c2.7-2.7 5.3 2.7 8 0s5.3 2.7 8 0M4 7v10M20 7v10" />,
  kettlebell: (
    <>
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
      <path d="M7.2 20.5a6 6 0 1 1 9.6 0Z" />
    </>
  ),
  weighted: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 3.5v3M12 17.5v3" />
    </>
  ),
  rings: (
    <>
      <path d="M7.5 3v8.5M16.5 3v8.5" />
      <circle cx="7.5" cy="15.5" r="3.6" />
      <circle cx="16.5" cy="15.5" r="3.6" />
    </>
  ),
  other: (
    <>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  bench: <path d="M3 10h18M6 10v8M18 10v8M4 14h16" />,
  'pullup-bar': <path d="M3 5h18M5 3v18M19 3v18M9.5 5v3.5M14.5 5v3.5M8 8.5h8" />,
}

export function EquipmentIcon({ equipment, className }: { equipment: Equipment | Accessory; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('size-5 shrink-0', className)}
      aria-hidden
      data-equipment={equipment}
    >
      {EQUIPMENT_PATHS[equipment]}
    </svg>
  )
}
