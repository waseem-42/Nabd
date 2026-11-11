import { useMemo, useState } from 'react'
import { Check, ChevronDown, Flame } from 'lucide-react'
import { warmupMinutes, warmupRoutine, prefersLowImpact } from '@/domain/loading'
import { useT } from '@/i18n'
import { fmtClock } from '@/i18n/format'
import type { Exercise, Muscle, WorkoutSession } from '@/types'
import { cx } from '@/ui'
import { useBodyProfile } from './useFormat'

const key = (id: string) => `nabd-warmup:${id}`
function readDone(id: string): boolean {
  try {
    return localStorage.getItem(key(id)) === '1'
  } catch {
    return false
  }
}
function writeDone(id: string) {
  try {
    localStorage.setItem(key(id), '1')
  } catch {
    /* private mode: collapsing for this visit is enough */
  }
}

/**
 * A short general warm-up built from today's muscles, the person's background and body:
 * pulse first, then the areas that will work. Collapses once ticked off or once lifting starts.
 */
export function WarmupCard({ session, lookup }: { session: WorkoutSession; lookup: (id: string) => Exercise | undefined }) {
  const t = useT()
  const profile = useBodyProfile()
  const started = session.entries.some((e) => e.sets.some((s) => s.done))
  const [open, setOpen] = useState(() => !started && !readDone(session.id))
  const [ticked, setTicked] = useState<Set<number>>(new Set())

  const { items, minutes, lowImpact } = useMemo(() => {
    const exercises = session.entries.map((e) => lookup(e.exerciseId)).filter((e): e is Exercise => !!e)
    const muscles: Muscle[] = exercises.flatMap((e) => [e.primary, ...e.secondary])
    const heavy = exercises.some((e) => e.equipment === 'barbell')
    const list = warmupRoutine(muscles, profile, heavy)
    return { items: list, minutes: warmupMinutes(list), lowImpact: prefersLowImpact(profile) }
  }, [session.entries, lookup, profile])

  if (!session.entries.length) return null

  function finish() {
    writeDone(session.id)
    setOpen(false)
  }

  return (
    <section className="overflow-hidden rounded-card border border-warn/25 bg-warn-soft" aria-label={t('body.warmupTitle')}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warn/15 text-warn">
          <Flame className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-text">{t('body.warmupTitle')}</span>
          <span className="block text-sm text-muted">{t('body.warmupMeta', { n: minutes })}</span>
        </span>
        <ChevronDown className={cx('size-5 shrink-0 text-muted transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="border-t border-warn/15 px-4 pt-2 pb-4">
          {lowImpact && <p className="mb-2 text-sm text-warn">{t('body.warmupLowImpact')}</p>}
          <ul className="m-0 flex list-none flex-col p-0">
            {items.map((item, i) => {
              const on = ticked.has(i)
              return (
                <li key={item.move}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTicked((prev) => {
                      const next = new Set(prev)
                      if (on) next.delete(i)
                      else next.add(i)
                      return next
                    })}
                    className="flex min-h-12 w-full items-center gap-3 text-start"
                  >
                    <span className={cx('flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors', on ? 'border-ok bg-ok text-ok-ink' : 'border-line-strong')}>
                      {on && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
                    </span>
                    <span className={cx('min-w-0 flex-1 text-base', on ? 'text-muted line-through' : 'text-text')}>{t(`body.move.${item.move}`)}</span>
                    {item.reps && ['legSwings', 'hipOpener'].includes(item.move) ? (
                      <span className="shrink-0 text-sm tabular-nums text-muted">{t('body.perSide', { n: item.amount })}</span>
                    ) : (
                      <span className="shrink-0 text-sm tabular-nums text-muted" dir="ltr">{item.reps ? `× ${item.amount}` : fmtClock(item.amount)}</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <button type="button" onClick={finish} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-surface text-sm font-semibold text-text">
            <Check className="size-4" aria-hidden />
            {t('body.warmupDone')}
          </button>
        </div>
      )}
    </section>
  )
}
