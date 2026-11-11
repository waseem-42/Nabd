/** Approved by the creator. Source poses remain exercise-specific. */
export const EXERCISE_VISUAL_STYLE = 'technical' as const

/** Walk to the final source pose and back, avoiding a jump straight to the start. */
export function poseSequence(count: number): number[] {
  if (!Number.isInteger(count) || count < 1) return []
  const forward = Array.from({ length: count }, (_, i) => i)
  return [...forward, ...forward.slice(1, -1).reverse()]
}
