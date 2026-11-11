import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { routes } from '@/app/routes'
import { deleteSession, useSession } from '@/db'
import { useLang, useT } from '@/i18n'
import { fmtDate } from '@/i18n/format'
import { ConfirmDialog, IconButton, Screen } from '@/ui'
import { SessionReport } from './parts/SessionReport'
import { useFormat } from './parts/useFormat'

export default function SessionDetail() {
  const t = useT()
  const lang = useLang()
  const fmt = useFormat()
  const navigate = useNavigate()
  const { id } = useParams()
  const session = useSession(id)
  const [confirm, setConfirm] = useState(false)

  if (session === undefined) return null
  if (session === null || session.status !== 'done') return <Navigate to={routes.progress} replace />

  return (
    <Screen
      title={fmt.sessionName(session)}
      subtitle={`${fmtDate(session.startedAt, lang, 'long')} · ${t(`common.place.${session.place}`)}`}
      onBack={() => navigate(-1)}
      actions={<IconButton label={t('progress.deleteSession')} icon={<Trash2 className="size-5" />} onClick={() => setConfirm(true)} />}
    >
      <SessionReport session={session} onExercise={(exId) => navigate(routes.exercise(exId))} />
      <ConfirmDialog
        open={confirm}
        title={t('progress.deleteTitle')}
        message={t('progress.deleteBody')}
        confirmLabel={t('common.delete')}
        tone="danger"
        onConfirm={async () => {
          setConfirm(false)
          await deleteSession(session.id)
          navigate(routes.progress, { replace: true })
        }}
        onCancel={() => setConfirm(false)}
      />
    </Screen>
  )
}
