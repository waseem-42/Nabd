import { Search, X } from 'lucide-react'
import { useT } from '@/i18n'
import { cx } from './cx'

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function SearchField({ value, onChange, placeholder, autoFocus, className }: SearchFieldProps) {
  const t = useT()
  const text = placeholder ?? t('common.search')
  return (
    <div className={cx('relative', className)}>
      <Search
        className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-faint"
        aria-hidden
      />
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={text}
        aria-label={text}
        className="min-h-12 w-full appearance-none rounded-full border border-line bg-surface ps-12 pe-12 text-base text-text placeholder:text-faint transition-colors focus:border-accent focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label={t('common.clear')}
          onClick={() => onChange('')}
          className="absolute end-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted active:bg-surface-2"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}
    </div>
  )
}
