import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useT } from '@/i18n'
import { Button } from '@/ui/Button'
import { Sheet } from '@/ui/Sheet'
import { SafetySources } from '@/screens/parts/ExerciseSafety'

const SafetyContext = createContext<(() => Promise<boolean>) | null>(null)

/** A per-session preparation reminder. No health data or acknowledgement is stored. */
export function SafetyProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [checks, setChecks] = useState([false, false, false])
  const pending = useRef<{ promise: Promise<boolean>; resolve: (ready: boolean) => void } | null>(null)
  const request = useCallback(() => {
    if (pending.current) return pending.current.promise
    let resolve!: (ready: boolean) => void
    const promise = new Promise<boolean>(done => { resolve = done })
    pending.current = { promise, resolve }
    setChecks([false, false, false])
    setOpen(true)
    return promise
  }, [])
  function close(ready: boolean) {
    const current = pending.current
    pending.current = null
    setOpen(false)
    current?.resolve(ready)
  }
  useEffect(() => () => { pending.current?.resolve(false); pending.current = null }, [])

  return <SafetyContext.Provider value={request}>
    {children}
    <Sheet open={open} onClose={() => close(false)} title={t('safety.before')} footer={
      <div className="flex flex-col gap-2">
        <Button fullWidth icon={<ShieldCheck className="size-5" />} disabled={!checks.every(Boolean)} onClick={() => close(true)}>{t('safety.start')}</Button>
        <Button fullWidth variant="ghost" onClick={() => close(false)}>{t('safety.notReady')}</Button>
      </div>
    }>
      <p className="text-sm leading-relaxed text-muted">{t('safety.intro')}</p>
      <div className="my-4 space-y-2">{(['safety.warm', 'safety.setup', 'safety.symptoms'] as const).map((key, i) =>
        <label key={key} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-control border border-line bg-surface-2 p-3 text-sm leading-relaxed">
          <input type="checkbox" className="mt-1 size-5 shrink-0 accent-accent" checked={checks[i]} onChange={event => setChecks(current => current.map((value, j) => j === i ? event.target.checked : value))} />
          <span>{t(key)}</span>
        </label>,
      )}</div>
      <p className="text-xs leading-relaxed text-warn">{t('safety.condition')}</p>
      <p className="mt-3 text-xs leading-relaxed text-danger">{t('safety.urgent')}</p>
      <SafetySources />
    </Sheet>
  </SafetyContext.Provider>
}

export function usePreparationCheck() {
  const request = useContext(SafetyContext)
  if (!request) throw new Error('usePreparationCheck requires SafetyProvider')
  return request
}
