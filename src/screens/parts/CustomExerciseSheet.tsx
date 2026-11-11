import { useState } from 'react'
import { Dumbbell, HeartPulse, Timer } from 'lucide-react'
import { createCustomExercise } from '@/db'
import { useT } from '@/i18n'
import { EQUIPMENT, MUSCLES, type Equipment, type Exercise, type ExerciseMode, type Muscle } from '@/types'
import { Button, Chip, EquipmentIcon, MuscleIcon, Segmented, Sheet, TextField, useToast } from '@/ui'

export interface CustomExerciseSheetProps {
  open: boolean
  onClose: () => void
  onCreated?: (exercise: Exercise) => void
}

/** Adds an exercise the catalogue doesn't have. One name serves both languages. */
export function CustomExerciseSheet({ open, onClose, onCreated }: CustomExerciseSheetProps) {
  const t = useT()
  const toast = useToast()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<ExerciseMode>('reps')
  const [primary, setPrimary] = useState<Muscle>('chest')
  const [equipment, setEquipment] = useState<Equipment>('bodyweight')
  const [saving, setSaving] = useState(false)

  function close() {
    setName('')
    onClose()
  }

  async function save() {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const exercise = await createCustomExercise({
        name: { en: trimmed, ar: trimmed },
        primary,
        secondary: [],
        equipment,
        needs: [],
        level: 'beginner',
        kind: mode === 'cardio' ? 'cardio' : mode === 'time' ? 'stretch' : 'strength',
        mode,
        art: null,
        steps: { en: [], ar: [] },
      })
      toast(t('common.saved'), { tone: 'ok' })
      close()
      onCreated?.(exercise)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t('library.create')}
      footer={
        <Button size="lg" fullWidth disabled={!name.trim()} loading={saving} onClick={() => void save()}>
          {t('common.save')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <TextField label={t('library.name')} value={name} onChange={setName} autoFocus maxLength={60} />
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('library.measure')}</p>
          <Segmented<ExerciseMode>
            label={t('library.measure')}
            value={mode}
            onChange={setMode}
            options={[
              { value: 'reps', label: t('library.mode.reps'), icon: <Dumbbell className="size-4" /> },
              { value: 'time', label: t('library.mode.time'), icon: <Timer className="size-4" /> },
              { value: 'cardio', label: t('library.mode.cardio'), icon: <HeartPulse className="size-4" /> },
            ]}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('library.primary')}</p>
          <div className="flex flex-wrap gap-2">
            {MUSCLES.map((m) => (
              <Chip key={m} selected={primary === m} icon={<MuscleIcon muscle={m} />} className="ps-3" onClick={() => setPrimary(m)}>
                {t(`common.muscle.${m}`)}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-muted">{t('library.equipment')}</p>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((e) => (
              <Chip key={e} selected={equipment === e} icon={<EquipmentIcon equipment={e} className="size-[1.15rem]" />} className="ps-3" onClick={() => setEquipment(e)}>
                {t(`common.equipment.${e}`)}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
