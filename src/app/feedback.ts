/**
 * Short sound and vibration cues (rest over, set done). Both fail silently: browsers may block
 * audio until the first tap, and most desktops cannot vibrate.
 */
import { getSettings } from '@/store/settings'

let audio: AudioContext | null = null

function context(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  audio ??= new AudioContext()
  if (audio.state === 'suspended') void audio.resume().catch(() => {})
  return audio
}

/** Call from a tap handler once so later cues are allowed to play (iOS unlocks audio on a gesture). */
export function unlockAudio(): void {
  context()
}

/** Two quick rising tones. */
export function beep(): void {
  const ctx = context()
  if (!ctx) return
  const t0 = ctx.currentTime
  for (const [i, freq] of [880, 1320].entries()) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const start = t0 + i * 0.18
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
    osc.connect(gain).connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.17)
  }
}

export function vibrate(pattern: number | number[]): void {
  if (!getSettings().haptics) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Not supported.
  }
}
