import { useT } from '@/i18n'
import { cx } from './cx'

/** The canonical mark is shared by the app, favicon, and generated install icons. */
export function BrandMark({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("inline-block size-10 shrink-0 bg-[url('/brand/symbol.svg')] bg-contain bg-center bg-no-repeat", className)} />
}

export function Brand({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
  const t = useT()
  return (
    <div className={cx('inline-flex items-center gap-3', size === 'lg' && 'gap-4', className)}>
      <BrandMark className={size === 'lg' ? 'size-16' : 'size-10'} />
      <span className="flex flex-col items-start">
        <span className={cx('font-bold leading-tight text-text', size === 'lg' ? 'text-display' : 'text-2xl')}>
          {t('common.appName')}
        </span>
        <span className="mt-1 text-[0.6rem] font-medium tracking-[0.2em] text-muted" lang="en" dir="ltr">NABD · TRAINING</span>
      </span>
    </div>
  )
}
