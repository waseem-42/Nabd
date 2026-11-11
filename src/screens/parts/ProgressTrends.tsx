import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, TrendingDown, TrendingUp } from 'lucide-react'
import { routes } from '@/app/routes'
import { muscleSplit, recentRecords, weeklyHistory } from '@/domain/progress'
import { useLang, useT } from '@/i18n'
import { fmtDate, kgToUnit } from '@/i18n/format'
import type { ExerciseLookup, WorkoutSession } from '@/types'
import { Card, cx, ListRow, MuscleGroupIcon, Section } from '@/ui'
import { useFormat } from './useFormat'

const WEEKS = 8
const SPLIT_DAYS = 28

/** Eight weeks of training at a glance, with this week's volume against last week's. */
export function WeeklyTrend({ sessions, now }: { sessions: WorkoutSession[]; now: number }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const weeks = useMemo(() => weeklyHistory(sessions, WEEKS, now), [sessions, now])
  const max = Math.max(1, ...weeks.map((w) => w.count))
  const current = weeks.at(-1)!
  const previous = weeks.at(-2)!
  const delta = previous.volume > 0 ? Math.round(((current.volume - previous.volume) / previous.volume) * 100) : null

  return (
    <Section title={t('progress.weeksTitle')}>
      <Card>
        <div className="flex h-28 items-end gap-2" role="img" aria-label={t('progress.weeksLabel', { n: WEEKS })}>
          {weeks.map((w, i) => {
            const last = i === weeks.length - 1
            return (
              <div key={w.start} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className={cx('text-xs tabular-nums', last ? 'font-semibold text-accent' : 'text-muted')}>{w.count > 0 ? fmt.number(w.count) : ''}</span>
                <span
                  className={cx('w-full rounded-t-md', last ? 'bg-accent' : w.count ? 'bg-line-strong' : 'bg-line')}
                  style={{ height: w.count ? `${Math.max(12, (w.count / max) * 100)}%` : '3px' }}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-faint">
          <span>{fmtDate(new Date(`${weeks[0]!.start}T12:00:00`), lang)}</span>
          <span className="text-accent">{t('progress.thisWeek')}</span>
        </div>
        <p className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm text-muted">
          {delta === null ? (
            t('progress.volumeThisWeek', { volume: fmt.weightWithUnit(Math.round(current.volume)) })
          ) : (
            <>
              {delta >= 0 ? <TrendingUp className="size-4 shrink-0 text-ok" aria-hidden /> : <TrendingDown className="size-4 shrink-0 text-warn" aria-hidden />}
              <span>{t(delta >= 0 ? 'progress.volumeUp' : 'progress.volumeDown', { pct: fmt.number(Math.abs(delta)) })}</span>
            </>
          )}
        </p>
      </Card>
    </Section>
  )
}

/** Where the last four weeks of sets went, and which groups got none. */
export function MuscleSplit({ sessions, lookup, now }: { sessions: WorkoutSession[]; lookup: ExerciseLookup; now: number }) {
  const t = useT()
  const fmt = useFormat()
  const split = useMemo(() => muscleSplit(sessions, lookup, now - SPLIT_DAYS * 86_400_000), [sessions, lookup, now])
  const max = Math.max(1, ...split.map((s) => s.sets))
  if (!split.some((s) => s.sets > 0)) return null
  const missed = split.filter((s) => s.sets === 0)

  return (
    <Section title={t('progress.splitTitle')}>
      <Card>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {split.map(({ group, sets }) => (
            <li key={group} className="flex items-center gap-3">
              <MuscleGroupIcon group={group} className="h-7 text-muted" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className={cx('text-sm font-medium', sets ? 'text-text' : 'text-faint')}>{t(`common.group.${group}`)}</span>
                  <span className="text-xs tabular-nums text-muted">{t('progress.setCount', { n: fmt.number(sets) })}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-pill bg-line">
                  <div className="h-full rounded-pill bg-accent" style={{ width: `${(sets / max) * 100}%` }} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-faint">
          {missed.length
            ? t('progress.splitMissed', { groups: missed.map((m) => t(`common.group.${m.group}`)).join('، ') })
            : t('progress.splitBalanced')}
        </p>
      </Card>
    </Section>
  )
}

/** The latest personal records; each opens the exercise it was set on. */
export function RecentRecords({ sessions }: { sessions: WorkoutSession[] }) {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const navigate = useNavigate()
  const records = useMemo(() => recentRecords(sessions, 5), [sessions])
  if (!records.length) return null
  return (
    <Section title={t('progress.recordsTitle')}>
      <Card padded={false} className="py-1">
        {records.map((r) => (
          <ListRow
            key={`${r.sessionId}-${r.exerciseId}`}
            leading={<Trophy className="size-5 text-accent" />}
            title={fmt.exerciseName(r.exerciseId)}
            subtitle={fmtDate(r.startedAt, lang)}
            chevron
            onClick={() => navigate(routes.exercise(r.exerciseId))}
          />
        ))}
      </Card>
    </Section>
  )
}

/** Change in body weight over about a month, in the user's unit; null without two entries. */
export function weightChange(weights: { day: string; kg: number }[], unit: 'kg' | 'lb'): number | null {
  const latest = weights.at(-1)
  if (!latest || weights.length < 2) return null
  const cutoff = new Date(`${latest.day}T12:00:00`).getTime() - 30 * 86_400_000
  const base = weights.find((w) => new Date(`${w.day}T12:00:00`).getTime() >= cutoff) ?? weights[0]!
  if (base.day === latest.day) return null
  return Math.round(kgToUnit(latest.kg - base.kg, unit) * 10) / 10
}
