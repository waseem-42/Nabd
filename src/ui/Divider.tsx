import { cx } from './cx'

export function Divider({ className }: { className?: string }) {
  return <hr className={cx('m-0 h-px border-0 bg-line', className)} />
}
