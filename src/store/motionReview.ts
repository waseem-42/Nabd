import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const MOTION_STYLES = ['sculpted', 'technical', 'duotone', 'athlete', 'contour', 'segments', 'comparison'] as const
export const NEW_MOTION_STYLES = ['athlete', 'contour', 'segments', 'comparison'] as const
export type MotionStyle = typeof MOTION_STYLES[number]

/** A review decision for the sample; deliberately separate from the exercise catalogue. */
export const useMotionReview = create<{ approved: MotionStyle | null; approve: (style: MotionStyle) => void; clear: () => void }>()(
  persist((set) => ({ approved: 'technical', approve: (approved) => set({ approved }), clear: () => set({ approved: null }) }), { name: 'nabd-motion-review', version: 2, migrate: () => ({ approved: 'technical' }) }),
)
