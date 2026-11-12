import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { routes } from '@/app/routes'
import { useNow } from '@/app/useNow'
import { useAllExercises, useDoneSessions } from '@/db'
import { sessionDurationSec, weekStreak, weekSummary } from '@/domain/progress'
import { useLang, useT } from '@/i18n'
import { fmtDate, isoDay } from '@/i18n/format'
import { useSettings } from '@/store/settings'
import { Button, ListRow, StatTile } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { BodyWeightCard, MuscleSplit, RecentRecords, WeeklyTrend } from './parts/ProgressTrends'
import { useFormat } from './parts/useFormat'

/** Log: this week at a glance, records, and past workouts — all for the current place. */
export default function Log() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const fmt = useFormat()
  const now = useNow(60_000)
  const place = useSettings((s) => s.place)
  const all = useDoneSessions()
  const { byId } = useAllExercises()
  const [limit, setLimit] = useState(10)
  const sessions = useMemo(() => (all ?? []).filter((s) => s.place === place), [all, place])
  const week = useMemo(() => weekSummary(sessions, now), [sessions, now])
  // Minutes trained on the days of this week (the same days the count covers).
  const minutes = useMemo(() => {
    const days = new Set(week.days.map((d) => d.day))
    return Math.round(sessions.filter((s) => days.has(isoDay(s.startedAt))).reduce((sum, s) => sum + sessionDurationSec(s), 0) / 60)
  }, [sessions, week])

  if (!all) return null
  return (
    <div className="flex flex-col gap-2 pt-2">
      <section aria-label={t('app.log.week')} className="grid grid-cols-3 gap-2 px-5">
        <StatTile value={fmt.number(week.count)} label={t('app.log.sessions')} tone={place} />
        <StatTile value={fmt.number(minutes)} label={t('app.log.minutes')} />
        <StatTile value={fmt.number(weekStreak(sessions, now))} label={t('app.log.streak')} />
      </section>

      {sessions.length === 0 ? (
        <p className="mx-5 rounded-card border border-line bg-surface p-6 text-center text-muted">{t('app.log.empty')}</p>
      ) : (
        <>
          <WeeklyTrend sessions={sessions} now={now} />
          <MuscleSplit sessions={sessions} lookup={byId} now={now} />
          <RecentRecords sessions={sessions} />
          <section aria-labelledby="history" className="px-5 py-3">
            <h2 id="history" className="mb-2 text-lg font-bold">{t('app.log.history')}</h2>
            <ul className="-mx-5 m-0 list-none p-0">
              {sessions.slice(0, limit).map((s) => (
                <li key={s.id}>
                  <ListRow
                    leading={<MotionThumb exerciseId={s.entries[0]?.exerciseId ?? ''} name="" still className="size-12 rounded-control" />}
                    title={fmt.sessionName(s)}
                    subtitle={`${fmtDate(s.startedAt, lang, 'short')} · ${t('app.minutes', { n: fmt.number(Math.round(sessionDurationSec(s) / 60)) })}`}
                    chevron
                    onClick={() => navigate(routes.session(s.id))}
                  />
                </li>
              ))}
            </ul>
            {sessions.length > limit && <Button variant="ghost" fullWidth onClick={() => setLimit((n) => n + 20)}>{t('progress.showMore')}</Button>}
          </section>
        </>
      )}
      <BodyWeightCard />
    </div>
  )
}
