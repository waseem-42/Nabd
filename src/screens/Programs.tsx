import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, ChevronRight, Plus, Sparkles, TriangleAlert } from 'lucide-react'
import { routes } from '@/app/routes'
import { PROGRAM_TEMPLATES } from '@/data/catalog'
import { createProgram, useAllExercises, usePrograms } from '@/db'
import { templateFit } from '@/domain/place'
import { pick, useLang, useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { Place } from '@/types'
import { Badge, Button, Card, ListRow, Screen, Section, Segmented, Sheet, TextField } from '@/ui'
import { useHomeGear } from './parts/useFormat'

export default function Programs() {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const programs = usePrograms()
  const activeId = useSettings((s) => s.activeProgramId)
  const currentPlace = useSettings((s) => s.place)
  const level = useSettings((s) => s.level)
  const gear = useHomeGear()
  const { byId } = useAllExercises()
  const [place, setPlace] = useState<Place>(currentPlace)
  const [creating, setCreating] = useState(false)

  const templates = useMemo(
    () =>
      PROGRAM_TEMPLATES.filter((p) => p.place === place)
        .map((p) => ({
          template: p,
          fit: templateFit(p, place, gear, byId),
        }))
        // Programs for the person's level first, keeping the catalogue order otherwise.
        .sort((a, b) => Number(b.template.level === level) - Number(a.template.level === level)),
    [place, gear, byId, level],
  )

  return (
    <Screen title={t('programs.title')} onBack={() => navigate(-1)}>
      {programs && programs.length > 0 && (
        <Section title={t('programs.mine')}>
          <Card padded={false} className="py-1">
            {programs.map((p) => (
              <ListRow
                key={p.id}
                leading={<CalendarDays className={p.place === 'home' ? 'size-5 text-home' : 'size-5 text-gym'} />}
                title={p.name}
                subtitle={`${t('programs.days', { n: p.routineIds.length })} · ${t(`common.place.${p.place}`)}`}
                trailing={p.id === activeId ? <Badge tone="accent">{t('programs.active')}</Badge> : undefined}
                chevron
                onClick={() => navigate(routes.program(p.id))}
              />
            ))}
          </Card>
        </Section>
      )}

      <Section>
        <Button variant="secondary" fullWidth icon={<Plus className="size-5" />} onClick={() => setCreating(true)}>
          {t('programs.create')}
        </Button>
      </Section>

      <Section title={t('programs.ready')}>
        <Segmented<Place>
          label={t('common.placeLabel')}
          value={place}
          onChange={setPlace}
          options={[
            { value: 'home', label: t('common.place.home') },
            { value: 'gym', label: t('common.place.gym') },
          ]}
        />
        <div className="mt-4 flex flex-col gap-3">
          {templates.map(({ template, fit }) => (
            <button
              key={template.id}
              type="button"
              onClick={() => navigate(routes.program(template.id))}
              className="rounded-card text-start transition-transform active:scale-[0.99]"
            >
              <Card tone={template.place}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-text">{pick(template.name, lang)}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{pick(template.description, lang)}</p>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0 text-faint rtl:-scale-x-100" aria-hidden />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={template.place}>{t('programs.perWeek', { n: template.daysPerWeek })}</Badge>
                  <Badge tone={template.level === level ? 'accent' : 'neutral'}>{t(`common.level.${template.level}`)}</Badge>
                  {template.level === level && <Badge tone="accent" icon={<Sparkles className="size-3.5" />}>{t('body.recommended')}</Badge>}
                  {place === 'home' &&
                    (fit.fits ? (
                      <Badge tone="ok" icon={<Check className="size-3.5" />}>
                        {t('programs.fits')}
                      </Badge>
                    ) : (
                      <Badge tone="warn" icon={<TriangleAlert className="size-3.5" />}>
                        {t('programs.needsGear')}
                      </Badge>
                    ))}
                </div>
              </Card>
            </button>
          ))}
        </div>
      </Section>

      <NewProgramSheet
        open={creating}
        onClose={() => setCreating(false)}
        place={currentPlace}
        onCreated={(id) => navigate(routes.program(id))}
      />
    </Screen>
  )
}

function NewProgramSheet({
  open,
  onClose,
  place: initialPlace,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  place: Place
  onCreated: (id: string) => void
}) {
  const t = useT()
  const [name, setName] = useState('')
  const [place, setPlace] = useState<Place>(initialPlace)

  async function save() {
    const program = await createProgram({ name: name.trim(), place, routineIds: [] })
    setName('')
    onClose()
    onCreated(program.id)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t('programs.create')}
      footer={
        <Button size="lg" fullWidth disabled={!name.trim()} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField label={t('programs.name')} value={name} onChange={setName} autoFocus maxLength={60} />
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('common.placeLabel')}</p>
          <Segmented<Place>
            label={t('common.placeLabel')}
            value={place}
            onChange={setPlace}
            options={[
              { value: 'home', label: t('common.place.home') },
              { value: 'gym', label: t('common.place.gym') },
            ]}
          />
        </div>
      </div>
    </Sheet>
  )
}
