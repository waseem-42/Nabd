import { useMemo, useState } from 'react'
import { Flame, Inbox, Plus, Timer, Trash2 } from 'lucide-react'
import { EXERCISES } from '@/data/catalog'
import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import type { ArtFile, Place } from '@/types'
import {
  Badge,
  Button,
  Card,
  Chip,
  ChipRow,
  ConfirmDialog,
  Divider,
  EmptyState,
  ExerciseArt,
  ExercisePickerSheet,
  ExerciseRow,
  IconButton,
  LineChart,
  ListRow,
  PlaceToggle,
  ProgressRing,
  Screen,
  SearchField,
  Section,
  Segmented,
  Sheet,
  StatTile,
  Stepper,
  TextField,
  ToastProvider,
  Toggle,
  useToast,
  WeekDots,
} from './index'

/** Tiny hand-made two-frame figure (arms down → arms up) to show the cross-fade. */
const DEMO_ART: ArtFile = {
  viewBox: [0, 0, 100, 100],
  frames: [
    'M42 18a8 8 0 1 0 16 0a8 8 0 1 0-16 0ZM45 30h10v32H45ZM26 34l19 4v7l-19-4ZM74 34l-19 4v7l19-4ZM45 62h4v28h-6ZM51 62h4l6 28h-6Z',
    'M42 18a8 8 0 1 0 16 0a8 8 0 1 0-16 0ZM45 30h10v32H45ZM26 12l19 18v7L26 19ZM74 12L55 30v7l19-18ZM42 62h5l-9 28h-6ZM53 62h5l11 28h-6Z',
  ],
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Section title={title}>
      <div className="flex flex-col gap-3">{children}</div>
    </Section>
  )
}

function Inner() {
  const t = useT()
  const lang = useSettings((s) => s.lang)
  const set = useSettings((s) => s.set)
  const toast = useToast()

  const [place, setPlace] = useState<Place>('home')
  const [seg, setSeg] = useState<'a' | 'b' | 'c'>('a')
  const [chip, setChip] = useState('all')
  const [on, setOn] = useState(true)
  const [name, setName] = useState('')
  const [q, setQ] = useState('')
  const [weight, setWeight] = useState(62.5)
  const [reps, setReps] = useState(8)
  const [sheet, setSheet] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [picker, setPicker] = useState(false)
  const [remaining, setRemaining] = useState(0.62)

  const samples = useMemo(() => EXERCISES.slice(0, 4), [])
  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])
  const trained = useMemo(() => {
    const out: string[] = []
    for (const back of [0, 2, 3]) {
      const d = new Date()
      d.setDate(d.getDate() - back)
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return out
  }, [])

  const chipOptions = ['all', 'chest', 'back', 'legs'].map((v) => ({
    value: v,
    label: v === 'all' ? t('common.all') : t(`common.group.${v as 'chest'}`),
  }))

  return (
    <Screen
      title={t('common.appName')}
      subtitle="UI kit · /dev/ui"
      footer={
        <Button size="lg" fullWidth icon={<Flame className="size-6" />}>
          {t('common.next')}
        </Button>
      }
      actions={
        <Segmented
          label="Language"
          value={lang}
          onChange={(l) => set({ lang: l })}
          options={[
            { value: 'ar', label: 'العربية' },
            { value: 'en', label: 'English' },
          ]}
          className="w-48"
        />
      }
      onBack={() => history.back()}
    >
      <Block title="PlaceToggle">
        <PlaceToggle value={place} onChange={setPlace} />
        <PlaceToggle value={place} onChange={setPlace} size="md" />
        <Card tone={place}>{t(`common.place.${place}`)}</Card>
      </Block>

      <Block title="Button / IconButton">
        <Button size="lg" fullWidth icon={<Flame className="size-6" />}>
          {t('common.done')}
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button>{t('common.save')}</Button>
          <Button variant="secondary">{t('common.cancel')}</Button>
          <Button variant="ghost">{t('common.edit')}</Button>
          <Button variant="danger" icon={<Trash2 className="size-5" />}>
            {t('common.delete')}
          </Button>
          <Button loading>{t('common.save')}</Button>
          <Button disabled>{t('common.save')}</Button>
        </div>
        <div className="flex gap-3">
          <IconButton label={t('common.add')} icon={<Plus className="size-6" />} variant="accent" />
          <IconButton label={t('common.add')} icon={<Plus className="size-6" />} variant="solid" />
          <IconButton label={t('common.add')} icon={<Plus className="size-6" />} />
        </div>
      </Block>

      <Block title="Stepper">
        <Card>
          <Stepper label={t('common.unit.kg')} value={weight} onChange={setWeight} step={2.5} decimals={1} unit={t('common.unit.kg')} max={500} />
          <Divider className="my-4" />
          <Stepper label={t('common.reps')} value={reps} onChange={setReps} min={1} max={100} unit={t('common.reps')} />
        </Card>
      </Block>

      <Block title="Segmented / Chips / Toggle">
        <Segmented
          label="Demo"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'a', label: t('common.sets') },
            { value: 'b', label: t('common.reps') },
            { value: 'c', label: t('common.min') },
          ]}
        />
        <ChipRow label={t('common.filter')} options={chipOptions} value={chip} onChange={setChip} />
        <div className="flex gap-2">
          <Chip selected>{t('common.muscle.chest')}</Chip>
          <Chip>{t('common.muscle.back')}</Chip>
        </div>
        <div className="flex items-center justify-between rounded-card border border-line bg-surface px-4 py-3">
          <span className="text-base">{t('common.done')}</span>
          <Toggle checked={on} onChange={setOn} label={t('common.done')} />
        </div>
        <div className="flex gap-2">
          <Badge>{t('common.level.beginner')}</Badge>
          <Badge tone="accent">{t('common.muscle.chest')}</Badge>
          <Badge tone="home">{t('common.place.home')}</Badge>
          <Badge tone="gym">{t('common.place.gym')}</Badge>
          <Badge tone="ok">{t('common.done')}</Badge>
        </div>
      </Block>

      <Block title="Inputs">
        <TextField label={t('common.edit')} value={name} onChange={setName} placeholder="…" hint={t('common.search')} />
        <TextField label={t('common.edit')} value="" onChange={() => {}} error={t('common.noResults')} />
        <SearchField value={q} onChange={setQ} placeholder={t('common.searchExercises')} />
      </Block>

      <Block title="ListRow / Card / EmptyState">
        <Card padded={false}>
          <ListRow leading={<Timer className="size-6 text-accent" />} title={t('common.sets')} subtitle={t('common.reps')} chevron onClick={() => toast(t('common.done'), { tone: 'ok' })} />
          <Divider />
          <ListRow title={t('common.save')} trailing={<Badge tone="ok">{t('common.done')}</Badge>} />
        </Card>
        <Card tone="raised">raised</Card>
        <EmptyState icon={<Inbox className="size-9" />} title={t('common.noResults')} body={t('common.noResultsHint')} action={<Button variant="secondary">{t('common.add')}</Button>} />
      </Block>

      <Block title="ExerciseArt / ExerciseRow">
        <div className="flex flex-wrap gap-3">
          <ExerciseArt slug="bench-press" name="Bench" className="size-40 rounded-card" />
          <ExerciseArt slug={null} data={DEMO_ART} still className="size-16 rounded-2xl" />
          <ExerciseArt slug="__missing__" name="Fallback" className="size-16 rounded-2xl" />
          <ExerciseArt slug={null} className="size-16 rounded-2xl" />
        </div>
        <Card padded={false}>
          {samples.map((e, i) => (
            <div key={e.id}>
              {i > 0 && <Divider />}
              <ExerciseRow exercise={e} artData={i === 0 ? DEMO_ART : undefined} onClick={() => {}} />
            </div>
          ))}
        </Card>
        <Button variant="secondary" onClick={() => setPicker(true)}>
          ExercisePickerSheet
        </Button>
      </Block>

      <Block title="StatTile / WeekDots">
        <div className="grid grid-cols-2 gap-3">
          <StatTile value="12" label={t('common.sets')} tone="accent" />
          <StatTile value="62.5" unit={t('common.unit.kg')} label={t('common.reps')} />
        </div>
        <Card>
          <WeekDots today={today} trainedDays={trained} />
        </Card>
      </Block>

      <Block title="LineChart">
        <Card>
          <LineChart
            label="Demo"
            points={[
              { label: '1/9', value: 60 },
              { label: '8/9', value: 62.5 },
              { label: '15/9', value: 62.5 },
              { label: '22/9', value: 65 },
              { label: '29/9', value: 64 },
              { label: '6/10', value: 70 },
            ]}
          />
        </Card>
        <LineChart label="Empty" points={[{ label: 'a', value: 1 }]} />
      </Block>

      <Block title="ProgressRing">
        <div className="flex flex-col items-center gap-4">
          <ProgressRing progress={remaining} label={t('common.sec')}>
            <span className="text-num-xl font-bold tabular-nums">1:08</span>
            <span className="text-sm text-muted">{t('common.sec')}</span>
          </ProgressRing>
          <Segmented
            label="Demo"
            value={String(remaining) as '0.62'}
            onChange={(v) => setRemaining(Number(v))}
            options={[
              { value: '0.62', label: '62%' },
              { value: '0.25', label: '25%' },
              { value: '1', label: '100%' },
            ]}
            className="w-64"
          />
        </div>
      </Block>

      <Block title="Overlays">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Sheet
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            ConfirmDialog
          </Button>
          <Button variant="secondary" onClick={() => toast(t('common.save'), { tone: 'ok' })}>
            Toast
          </Button>
        </div>
      </Block>

      <Sheet open={sheet} onClose={() => setSheet(false)} title={t('common.add')} footer={<Button fullWidth onClick={() => setSheet(false)}>{t('common.done')}</Button>}>
        <div className="flex flex-col gap-2 pb-2">
          {Array.from({ length: 14 }, (_, i) => (
            <ListRow key={i} title={`${t('common.sets')} ${i + 1}`} subtitle={t('common.reps')} />
          ))}
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirm}
        tone="danger"
        title={t('common.delete')}
        message={t('common.noResultsHint')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => setConfirm(false)}
      />
      <ExercisePickerSheet
        open={picker}
        onClose={() => setPicker(false)}
        exercises={EXERCISES}
        onPick={(e) => {
          setPicker(false)
          toast(e.name[lang])
        }}
      />
    </Screen>
  )
}

export default function Gallery() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  )
}
