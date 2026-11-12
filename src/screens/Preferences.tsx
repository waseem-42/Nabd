import { useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ExternalLink, Flame, Languages, Minus, Plus, Sun, Timer, TriangleAlert, Upload, Vibrate, Volume2, Weight } from 'lucide-react'
import { BackupError, downloadBackup, exportBackup, importBackup, readBackupFile, upsertBodyWeight, useBodyWeights, useDoneSessions } from '@/db'
import { fmtClock, fmtDate, isoDay } from '@/i18n/format'
import { BodyProfileForm } from './parts/BodyProfileForm'
import { useLang, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { Lang, Unit } from '@/types'
import { Brand, Button, Card, Chip, ConfirmDialog, IconButton, ListRow, Screen, Section, Segmented, Toggle, cx, useToast } from '@/ui'
import { HomeGearPicker } from './parts/HomeGearPicker'

const REST_PRESETS = [15, 30, 45, 60, 90, 120]
const BACKUP_KEY = 'nabd-last-backup'
const BACKUP_STALE_MS = 30 * 86_400_000

function readLastBackup(): number | null {
  try {
    const value = Number(localStorage.getItem(BACKUP_KEY))
    return value > 0 ? value : null
  } catch {
    return null
  }
}
function writeLastBackup(): number {
  const now = Date.now()
  try {
    localStorage.setItem(BACKUP_KEY, String(now))
  } catch {
    /* private mode: the reminder just stays */
  }
  return now
}

/** Settings, behind the gear icon in the header. */
export default function Preferences() {
  const t = useT()
  const navigate = useNavigate()
  const toast = useToast()
  const settings = useSettings()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<unknown>(null)
  const lang = useLang()
  const sessions = useDoneSessions()
  const [lastBackup, setLastBackup] = useState<number | null>(readLastBackup)
  const backupStale = !!sessions?.length && (lastBackup === null || Date.now() - lastBackup > BACKUP_STALE_MS)
  const weights = useBodyWeights()
  const latest = weights?.at(-1)?.kg ?? null
  const [draftKg, setDraftKg] = useState<number | null>(null)
  const weightKg = draftKg ?? latest

  async function onExport() {
    downloadBackup(await exportBackup())
    setLastBackup(writeLastBackup())
    toast(t('settings.exported'), { tone: 'ok' })
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    try {
      setPending(await readBackupFile(file))
    } catch (err) {
      toast(backupMessage(err), { tone: 'danger' })
    }
  }

  async function onImport() {
    const data = pending
    setPending(null)
    try {
      await importBackup(data)
      toast(t('settings.imported'), { tone: 'ok' })
    } catch (err) {
      toast(backupMessage(err), { tone: 'danger' })
    }
  }

  function backupMessage(err: unknown): string {
    if (err instanceof BackupError) {
      if (err.code === 'not-json' || err.code === 'not-nabd') return t('settings.badFile')
      if (err.code === 'unsupported-version') return t('settings.badVersion')
    }
    return t('settings.importFailed')
  }

  const restLabel = settings.restSec === 0 ? t('settings.restOff') : fmtClock(settings.restSec)

  return (
    <Screen title={t('app.settings')} onBack={() => navigate(-1)}>
      <Section title={t('settings.workout')}>
        <Card padded={false} className="divide-y divide-line overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <RowIcon tone="accent"><Timer className="size-5" /></RowIcon>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-text">{t('settings.rest')}</p>
                <p className="text-sm leading-snug text-muted">{t('settings.restHint')}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-control bg-bg p-2" dir="ltr">
              <IconButton label={t('workout.restLess')} icon={<Minus className="size-5" />} disabled={settings.restSec <= 0} onClick={() => settings.set({ restSec: Math.max(0, settings.restSec - 15) })} />
              <p className="text-num font-bold tabular-nums text-text" aria-live="polite">{restLabel}</p>
              <IconButton label={t('workout.restMore')} icon={<Plus className="size-5" />} disabled={settings.restSec >= 600} onClick={() => settings.set({ restSec: Math.min(600, settings.restSec + 15) })} />
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1.5" role="group" aria-label={t('settings.rest')}>
              {REST_PRESETS.map((sec) => (
                <Chip key={sec} className="justify-center px-0" selected={settings.restSec === sec} onClick={() => settings.set({ restSec: sec })}>
                  <span dir="ltr" className="tabular-nums">{fmtClock(sec)}</span>
                </Chip>
              ))}
            </div>
          </div>
          <SwitchRow icon={<Volume2 className="size-5" />} title={t('settings.sound')} checked={settings.sound} onChange={(sound) => settings.set({ sound })} />
          <SwitchRow icon={<Vibrate className="size-5" />} title={t('settings.haptics')} checked={settings.haptics} onChange={(haptics) => settings.set({ haptics })} />
          <SwitchRow icon={<Sun className="size-5" />} title={t('settings.keepAwake')} hint={t('settings.keepAwakeHint')} checked={settings.keepAwake} onChange={(keepAwake) => settings.set({ keepAwake })} />
          <SwitchRow icon={<Flame className="size-5" />} tone="warn" title={t('body.autoWarmup')} hint={t('settings.autoWarmupShort')} checked={settings.autoWarmup} onChange={(autoWarmup) => settings.set({ autoWarmup })} />
        </Card>
      </Section>

      <Section title={t('settings.general')}>
        <Card padded={false} className="divide-y divide-line overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <RowIcon><Languages className="size-5" /></RowIcon>
            <p className="min-w-0 flex-1 text-base font-medium text-text">{t('onboarding.language')}</p>
            <Segmented<Lang>
              className="w-44 shrink-0"
              label={t('onboarding.language')}
              value={settings.lang}
              onChange={(lang) => settings.set({ lang })}
              options={[
                { value: 'ar', label: 'العربية' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
          <div className="flex items-center gap-3 p-4">
            <RowIcon><Weight className="size-5" /></RowIcon>
            <p className="min-w-0 flex-1 text-base font-medium text-text">{t('onboarding.unit')}</p>
            <Segmented<Unit>
              className="w-44 shrink-0"
              label={t('onboarding.unit')}
              value={settings.unit}
              onChange={(unit) => settings.set({ unit })}
              options={[
                { value: 'kg', label: t('common.unit.kg') },
                { value: 'lb', label: t('common.unit.lb') },
              ]}
            />
          </div>
        </Card>
      </Section>

      <Section title={t('body.title')}>
        <Card className="flex flex-col gap-4">
          <BodyProfileForm weightKg={weightKg} onWeight={setDraftKg} />
          {weightKg === null && <p className="text-sm text-faint">{t('body.noWeight')}</p>}
          <Button
            variant="secondary"
            fullWidth
            disabled={draftKg === null || draftKg === latest}
            onClick={async () => {
              if (draftKg === null) return
              await upsertBodyWeight(isoDay(), draftKg)
              setDraftKg(null)
              toast(t('body.weightSaved'), { tone: 'ok' })
            }}
          >
            {t('body.saveWeight')}
          </Button>
        </Card>
      </Section>

      <Section title={t('settings.homeGear')}>
        <Card>
          <HomeGearPicker />
        </Card>
      </Section>

      <Section title={t('settings.data')}>
        <div className={backupStale ? 'mb-3 flex items-start gap-3 rounded-card border border-warn/25 bg-warn-soft p-4' : 'mb-3 px-1'}>
          {backupStale && <TriangleAlert className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />}
          <p className={backupStale ? 'text-sm leading-relaxed text-text' : 'text-sm text-muted'}>
            {sessions?.length ? t('settings.stored', { n: sessions.length }) + ' ' : ''}
            {lastBackup === null ? t('settings.neverBackedUp') : t('settings.lastBackup', { date: fmtDate(lastBackup, lang, 'long') })}
            {backupStale ? ' ' + t('settings.backupNudge') : ''}
          </p>
        </div>
        <Card padded={false} className="divide-y divide-line overflow-hidden">
          <ListRow
            leading={<RowIcon><Download className="size-5" /></RowIcon>}
            chevron
            title={t('settings.export')}
            subtitle={t('settings.exportHint')}
            onClick={() => void onExport()}
          />
          <ListRow
            leading={<RowIcon><Upload className="size-5" /></RowIcon>}
            chevron
            title={t('settings.import')}
            subtitle={t('settings.importHint')}
            onClick={() => fileInput.current?.click()}
          />
        </Card>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void onFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <p className="mt-3 text-sm text-faint">{t('settings.privacy')}</p>
      </Section>

      <Section title={t('settings.about')}>
        <Card className="flex flex-col gap-3 text-sm text-muted">
          <div className="mb-1 flex items-center justify-between gap-3">
            <Brand />
            <span className="text-xs text-faint" dir="ltr">v{__APP_VERSION__}</span>
          </div>
          <p className="text-base font-semibold text-text">{t('brand.tagline')}</p>
          <p>{t('brand.description')}</p>
          <p>{t('settings.basedOn')}</p>
          <p>{t('settings.credits')}</p>
          <a
            href="https://github.com/InlitX/GymMane"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-accent"
          >
            GymMane <ExternalLink className="size-4" aria-hidden />
          </a>
          <p>{t('settings.license')}</p>
        </Card>
      </Section>

      <ConfirmDialog
        open={pending !== null}
        title={t('settings.importTitle')}
        message={t('settings.importBody')}
        confirmLabel={t('settings.import')}
        tone="danger"
        onConfirm={() => void onImport()}
        onCancel={() => setPending(null)}
      />
    </Screen>
  )
}

/** A tinted square behind a settings icon. */
function RowIcon({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' | 'warn' }) {
  return (
    <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-control', tone === 'accent' ? 'bg-accent-soft text-accent' : tone === 'warn' ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted')} aria-hidden>
      {children}
    </span>
  )
}

/** One on/off setting: icon, title, optional hint and the switch. */
function SwitchRow({ icon, title, hint, checked, onChange, tone }: { icon: ReactNode; title: string; hint?: string; checked: boolean; onChange: (next: boolean) => void; tone?: 'default' | 'accent' | 'warn' }) {
  return (
    <div className="flex min-h-16 items-center gap-3 px-4 py-3">
      <RowIcon tone={tone}>{icon}</RowIcon>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-text">{title}</span>
        {hint && <span className="mt-0.5 block text-sm leading-snug text-muted">{hint}</span>}
      </span>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
