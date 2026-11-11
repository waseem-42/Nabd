import { useT } from '@/i18n'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { SafetySources } from './ExerciseSafety'

export function WorkoutSafetySheet({ open, onClose, onFinish, busy }: {
  open: boolean; onClose: () => void; onFinish: () => void; busy: boolean
}) {
  const t = useT()
  return <Sheet open={open} onClose={onClose} title={t('safety.stopTitle')} footer={
    <div className="space-y-2">
      <Button fullWidth variant="secondary" loading={busy} onClick={onFinish}>{t('safety.finish')}</Button>
      <p className="text-xs leading-relaxed text-muted">{t('safety.finishNote')}</p>
      <Button fullWidth variant="ghost" onClick={onClose}>{t('safety.close')}</Button>
    </div>
  }>
    <p className="rounded-control border border-danger/30 bg-danger-soft p-4 text-sm font-medium leading-relaxed text-danger">{t('safety.urgent')}</p>
    <p className="mt-4 text-sm leading-relaxed">{t('safety.stopBody')}</p>
    <p className="mt-4 text-xs leading-relaxed text-muted">{t('safety.saved')}</p>
    <SafetySources />
  </Sheet>
}
