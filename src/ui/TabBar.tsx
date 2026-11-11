import { NavLink } from 'react-router-dom'
import { Activity, ChartNoAxesColumn, Dumbbell } from 'lucide-react'
import type { ComponentType } from 'react'
import { TABS } from '@/app/routes'
import type { TabKey } from '@/app/routes'
import { useT } from '@/i18n'
import { cx } from './cx'

const ICONS: Record<TabKey, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  today: Activity,
  library: Dumbbell,
  progress: ChartNoAxesColumn,
}

/** Fixed bottom navigation: the coral capsule marks the current section. */
export function TabBar() {
  const t = useT()
  return (
    <nav
      aria-label={t('common.appName')}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md border-t border-line bg-bg/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl"
    >
      {TABS.map((tab) => {
        const Icon = ICONS[tab.key]
        return (
          <NavLink
            key={tab.key}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              cx(
                'relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-control text-xs font-medium transition-colors',
                isActive ? 'text-accent' : 'text-muted active:text-text',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  aria-hidden
                  className={cx(
                    'absolute inset-x-2 inset-y-0 -z-10 rounded-control bg-accent-soft transition-opacity duration-200',
                    isActive ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <Icon className="size-6" strokeWidth={isActive ? 2.5 : 2} />
                <span>{t(tab.label)}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
