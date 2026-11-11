import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useT } from '@/i18n'
import { cx } from './cx'

export interface StepperProps {
  value: number
  onChange: (value: number) => void
  /** Increment per tap. Default 1. */
  step?: number
  min?: number
  max?: number
  /** Decimal places kept and shown (0 = integers). Default 0. */
  decimals?: number
  /** Unit suffix shown beside the value ("kg", "reps"). */
  unit?: string
  /** Accessible name of the value ("Weight", "Reps"). */
  label: string
  className?: string
}

const HOLD_DELAY_MS = 420
const REPEAT_MS = 90

/**
 * Big − / + control for weight and reps. Tap the number to type it; hold − or + to repeat.
 * Always laid out left-to-right (− left, + right): it reads like a number line in both languages.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimals = 0,
  unit,
  label,
  className,
}: StepperProps) {
  const t = useT()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const valueRef = useRef(value)
  const timers = useRef<{ delay?: number; repeat?: number }>({})
  const latest = useRef({ onChange, step, min, max, decimals })

  useEffect(() => {
    valueRef.current = value
    latest.current = { onChange, step, min, max, decimals }
  })
  useEffect(() => () => stopRepeat(), [])

  const factor = 10 ** decimals
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * factor) / factor))

  function apply(dir: 1 | -1) {
    const l = latest.current
    const f = 10 ** l.decimals
    const next = Math.min(l.max, Math.max(l.min, Math.round((valueRef.current + dir * l.step) * f) / f))
    if (next !== valueRef.current) {
      valueRef.current = next
      l.onChange(next)
    }
  }

  function stopRepeat() {
    window.clearTimeout(timers.current.delay)
    window.clearInterval(timers.current.repeat)
  }

  function startRepeat(dir: 1 | -1) {
    stopRepeat()
    apply(dir)
    timers.current.delay = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => apply(dir), REPEAT_MS)
    }, HOLD_DELAY_MS)
  }

  function holdProps(dir: 1 | -1) {
    return {
      onPointerDown: (e: PointerEvent) => {
        if (e.button !== 0) return
        startRepeat(dir)
      },
      onPointerUp: stopRepeat,
      onPointerLeave: stopRepeat,
      onPointerCancel: stopRepeat,
      // Keyboard activation arrives as a click with detail 0 (pointer clicks are handled above).
      onClick: (e: { detail: number }) => {
        if (e.detail === 0) apply(dir)
      },
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    }
  }

  const shown = String(Number(value.toFixed(decimals)))

  function commit() {
    const parsed = parseFloat(draft.replace(',', '.').replace(/[^\d.\-]/g, ''))
    if (Number.isFinite(parsed)) {
      const next = clamp(parsed)
      valueRef.current = next
      if (next !== value) onChange(next)
    }
    setEditing(false)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  const btn =
    'flex size-16 shrink-0 select-none items-center justify-center rounded-full border border-line bg-surface-2 text-text transition-[background-color,transform] enabled:active:scale-90 enabled:active:bg-surface-3 disabled:opacity-35'

  return (
    <div
      role="group"
      aria-label={label}
      dir="ltr"
      className={cx('flex items-center justify-between gap-3', className)}
    >
      <button
        type="button"
        aria-label={`${t('common.stepper.dec')}: ${label}`}
        disabled={value <= min}
        className={btn}
        {...holdProps(-1)}
      >
        <Minus className="size-7" aria-hidden />
      </button>

      <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1.5">
        {editing ? (
          <input
            autoFocus
            value={draft}
            inputMode={decimals > 0 ? 'decimal' : 'numeric'}
            enterKeyHint="done"
            aria-label={`${t('common.stepper.edit')}: ${label}`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKey}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full min-w-0 rounded-control border border-accent bg-surface text-center text-num font-bold tabular-nums text-text outline-none"
          />
        ) : (
          <button
            type="button"
            aria-label={`${label}: ${shown}${unit ? ` ${unit}` : ''}. ${t('common.stepper.edit')}`}
            onClick={() => {
              setDraft(shown)
              setEditing(true)
            }}
            className="flex min-h-16 min-w-0 items-baseline justify-center gap-1.5 rounded-control px-2 active:bg-surface"
          >
            <span className="text-num font-bold tabular-nums text-text">{shown}</span>
            {unit && <span className="text-lg font-medium text-muted">{unit}</span>}
          </button>
        )}
      </div>

      <button
        type="button"
        aria-label={`${t('common.stepper.inc')}: ${label}`}
        disabled={value >= max}
        className={btn}
        {...holdProps(1)}
      >
        <Plus className="size-7" aria-hidden />
      </button>
    </div>
  )
}
