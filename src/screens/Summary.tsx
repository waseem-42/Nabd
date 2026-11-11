import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { PartyPopper } from 'lucide-react'
import { routes } from '@/app/routes'
import { useSession } from '@/db'
import { useT } from '@/i18n'
import { Button, Screen } from '@/ui'
import { SessionReport } from './parts/SessionReport'
import { useFormat } from './parts/useFormat'

/** Shown right after finishing a workout. */
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
      <SessionReport session={session} />
    </Screen>
  )
}
