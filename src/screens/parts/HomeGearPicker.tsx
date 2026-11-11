import { useT } from '@/i18n'
import { useSettings } from '@/store/settings'
import { ACCESSORIES, EQUIPMENT } from '@/types'
import { Chip, EquipmentIcon } from '@/ui'

/** Equipment the user can pick for home; bodyweight is always available, "other" is too vague to filter by. */
const HOME_EQUIPMENT = EQUIPMENT.filter((e) => e !== 'bodyweight' && e !== 'other')

function toggle<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** Multi-select of what the user owns at home. Writes straight to settings. */
export function HomeGearPicker() {
  const t = useT()
  const equipment = useSettings((s) => s.homeEquipment)
  const accessories = useSettings((s) => s.homeAccessories)
  const set = useSettings((s) => s.set)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-3 text-sm font-medium text-muted">{t('common.gear.equipment')}</p>
        <div className="flex flex-wrap gap-2">
          {HOME_EQUIPMENT.map((e) => {
            const on = equipment.includes(e)
            return (
              <Chip
                key={e}
                selected={on}
                icon={<EquipmentIcon equipment={e} className="size-4" />}
                onClick={() => set({ homeEquipment: toggle(equipment, e) })}
              >
                {t(`common.equipment.${e}`)}
              </Chip>
            )
          })}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-medium text-muted">{t('common.gear.accessories')}</p>
        <div className="flex flex-wrap gap-2">
          {ACCESSORIES.map((a) => {
            const on = accessories.includes(a)
            return (
              <Chip
                key={a}
                selected={on}
                icon={<EquipmentIcon equipment={a} className="size-4" />}
                onClick={() => set({ homeAccessories: toggle(accessories, a) })}
              >
                {t(`common.accessory.${a}`)}
              </Chip>
            )
          })}
        </div>
      </div>
      <p className="text-sm text-faint">{t('common.gear.hint')}</p>
    </div>
  )
}
