import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowDownRight, ArrowUpRight, Minus, PartyPopper } from 'lucide-react'
import { routes } from '@/app/routes'
import { useActiveProgram, useAllExercises, useDoneSessions, useSession } from '@/db'
import { compareWithPrevious, routineMinutes } from '@/domain/progress'
import { nextRoutine } from '@/domain/session'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { WorkoutSession } from '@/types'
import { Button, Card, Screen, Section } from '@/ui'
import { MotionThumb } from '@/ui/MotionThumb'
import { SessionReport } from './parts/SessionReport'
import { useFormat } from './parts/useFormat'

/** Shown right after finishing a workout: how it went against last time, and what comes next. */
export default function Summary() {
  const t = useT()
  const fmt = useFormat()
  const navigate = useNavigate()
  const { id } = useParams()
  const session = useSession(id)

  if (session === undefined) return null
  if (session === null) return <Navigate to={routes.today} replace />

  return (
    <Screen
      title={t('progress.summaryTitle')}
      subtitle={fmt.sessionName(session)}
      footer={
        <Button size="lg" fullWidth onClick={() => navigate(routes.today, { replace: true })}>
          {t('common.done')}
        </Button>
      }
    >
      <div className="flex justify-center py-2 text-accent" aria-hidden>
        <PartyPopper className="size-12" />
      </div>
      <VersusLast session={session} />
      <NextUp session={session} />
      <SessionReport session={session} />
    </Screen>
  )
}

function VersusLast({ session }: { session: WorkoutSession }) {
  const t = useT()
  const fmt = useFormat()
  const history = useDoneSessions()
  const { byId } = useAllExercises()
  const result = useMemo(() => (history ? compareWithPrevious(session, history, byId) : undefined), [session, history, byId])
  if (result === undefined || !session.routineId) return null
  const names = (ids: string[]) => fmt.list(ids.map(fmt.exerciseName))

  return (
    <Section title={t('app.s.vsLast')}>
      <Card className="flex flex-col gap-2.5">
        {result === null ? (
          <p className="text-muted">{t('app.s.first')}</p>
        ) : (
          <>
            {result.volumePct !== null && (
              <Line tone={result.volumePct > 0 ? 'up' : result.volumePct < 0 ? 'down' : 'same'}>
                {result.volumePct === 0
                  ? t('app.s.volumeSame')
                  : t(result.volumePct > 0 ? 'app.s.volumeUp' : 'app.s.volumeDown', { pct: fmt.number(Math.abs(result.volumePct)) })}
              </Line>
            )}
            {result.improved.length > 0 && <Line tone="up">{t('app.s.improved', { names: names(result.improved) })}</Line>}
            {result.declined.length > 0 && <Line tone="down">{t('app.s.declined', { names: names(result.declined) })}</Line>}
            {!result.improved.length && !result.declined.length && <Line tone="same">{t('app.s.steady')}</Line>}
          </>
        )}
      </Card>
    </Section>
  )
}

function Line({ tone, children }: { tone: 'up' | 'down' | 'same'; children: string }) {
  const Icon = tone === 'up' ? ArrowUpRight : tone === 'down' ? ArrowDownRight : Minus
  return (
    <p className="flex items-start gap-2 leading-snug">
      <Icon className={tone === 'up' ? 'mt-0.5 size-5 shrink-0 text-ok' : tone === 'down' ? 'mt-0.5 size-5 shrink-0 text-warn' : 'mt-0.5 size-5 shrink-0 text-muted'} aria-hidden />
      <span>{children}</span>
    </p>
  )
}

/** The plan's next routine, so the user leaves knowing what comes next. */
function NextUp({ session }: { session: WorkoutSession }) {
  const t = useT()
  const fmt = useFormat()
  const restSec = useSettings((s) => s.restSec)
  const plan = useActiveProgram()
  const history = useDoneSessions()
  const next = useMemo(() => (plan && history ? nextRoutine(plan.program, plan.routines, history) : null), [plan, history])
  if (!plan || !next || session.programId !== plan.program.id) return null

  return (
    <Section title={t('app.s.next')}>
      <Card className="flex items-center gap-3">
        <div className="flex shrink-0 -space-x-3 rtl:space-x-reverse">
          {next.items.slice(0, 3).map((item, i) => (
            <MotionThumb key={`${item.exerciseId}-${i}`} exerciseId={item.exerciseId} name="" still className="size-12 rounded-control border-2 border-surface" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{fmt.planName(next.name)}</p>
          <p className="text-sm text-muted">
            {t('app.exerciseCount', { n: fmt.number(next.items.length) })} · {t('app.minutes', { n: fmt.number(routineMinutes(next.items, restSec)) })}
          </p>
        </div>
      </Card>
    </Section>
  )
}
