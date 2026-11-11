import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ExternalLink, TriangleAlert, Upload } from 'lucide-react'
import { BackupError, downloadBackup, exportBackup, importBackup, readBackupFile, upsertBodyWeight, useBodyWeights, useDoneSessions } from '@/db'
import { fmtDate, isoDay } from '@/i18n/format'
import { BodyProfileForm } from './parts/BodyProfileForm'
import { useLang, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { Lang, Unit } from '@/types'
import { Brand, Button, Card, Chip, ConfirmDialog, ListRow, Screen, Section, Segmented, Stepper, Toggle, useToast } from '@/ui'
import { HomeGearPicker } from './parts/HomeGearPicker'

const REST_PRESETS = [60, 90, 120, 180]
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

  return (
    <Screen title={t('app.settings')} onBack={() => navigate(-1)}>
      <Section title={t('settings.homeGear')}>
        <Card>
          <HomeGearPicker />
        </Card>
      </Section>

      <Section title={t('settings.general')}>
        <Card className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-muted">{t('onboarding.language')}</p>
            <Segmented<Lang>
              label={t('onboarding.language')}
              value={settings.lang}
              onChange={(lang) => settings.set({ lang })}
              options={[
                { value: 'ar', label: 'العربية' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted">{t('onboarding.unit')}</p>
            <Segmented<Unit>
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

      <Section title={t('settings.workout')}>
        <Card className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-sm font-medium text-muted">{t('settings.rest')}</p>
            <div className="mb-4 grid grid-cols-4 gap-2" role="group" aria-label={t('settings.rest')}>
              {REST_PRESETS.map((sec) => (
                <Chip key={sec} className="justify-center px-0" selected={settings.restSec === sec} onClick={() => settings.set({ restSec: sec })}>
                  <span dir="ltr" className="tabular-nums">{sec < 60 ? `0:${sec}` : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`}</span>
                </Chip>
              ))}
            </div>
            <Stepper
              label={t('settings.rest')}
              value={settings.restSec}
              onChange={(restSec) => settings.set({ restSec })}
              step={15}
              min={0}
              max={600}
              unit={t('common.sec')}
            />
          </div>
          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-text">{t('settings.sound')}</span>
            <Toggle checked={settings.sound} onChange={(sound) => settings.set({ sound })} label={t('settings.sound')} />
          </label>
          <div>
            <label className="flex items-center justify-between gap-4">
              <span className="text-base text-text">{t('body.autoWarmup')}</span>
              <Toggle checked={settings.autoWarmup} onChange={(autoWarmup) => settings.set({ autoWarmup })} label={t('body.autoWarmup')} />
            </label>
          </div>
          <label className="flex items-center justify-between gap-4">
            <span className="text-base text-text">{t('settings.haptics')}</span>
            <Toggle checked={settings.haptics} onChange={(haptics) => settings.set({ haptics })} label={t('settings.haptics')} />
          </label>
          <div>
            <label className="flex items-center justify-between gap-4">
              <span className="text-base text-text">{t('settings.keepAwake')}</span>
              <Toggle checked={settings.keepAwake} onChange={(keepAwake) => settings.set({ keepAwake })} label={t('settings.keepAwake')} />
            </label>
          </div>
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
        <Card padded={false} className="py-1">
          <ListRow
            leading={<Download className="size-5 text-muted" />}
            title={t('settings.export')}
            subtitle={t('settings.exportHint')}
            onClick={() => void onExport()}
          />
          <ListRow
            leading={<Upload className="size-5 text-muted" />}
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
