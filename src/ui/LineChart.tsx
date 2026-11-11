import { useId } from 'react'
import { TrendingUp } from 'lucide-react'
import { useT } from '@/i18n'
import { cx } from './cx'

export interface LineChartPoint {
  /** Short x label (a date). Only the first and last are drawn. */
  label: string
  value: number
}

export interface LineChartProps {
  /** Oldest first. Time always runs left → right, in Arabic too. */
  points: readonly LineChartPoint[]
  /** Formats the guide-line and last-point values. Default: up to 1 decimal. */
  formatValue?: (n: number) => string
  /** Accessible summary of what the chart shows ("Bench press, estimated max"). */
  label: string
  /** Chart height in px at the 320-wide design size. Default 168. */
  height?: number
  /** Overrides the empty-state text (< 2 points). */
  emptyLabel?: string
  className?: string
}

const W = 320
const PAD_L = 10
const PAD_R = 46
const PAD_T = 26
const PAD_B = 26

const defaultFormat = (n: number) => String(Math.round(n * 10) / 10)

export function LineChart({ points, formatValue = defaultFormat, label, height = 168, emptyLabel, className }: LineChartProps) {
  const t = useT()
  const gid = useId().replace(/:/g, '')

  if (points.length < 2) {
    return (
      <div
        className={cx(
          'flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line px-6 text-center text-muted',
          className,
        )}
        style={{ minHeight: height }}
      >
        <TrendingUp className="size-7 text-faint" aria-hidden />
        <p className="text-sm">{emptyLabel ?? t('common.chart.empty')}</p>
      </div>
    )
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const plotW = W - PAD_L - PAD_R
  const plotH = height - PAD_T - PAD_B
  const xAt = (i: number) => PAD_L + (i / (points.length - 1)) * plotW
  const yAt = (v: number) => PAD_T + plotH - ((v - min) / span) * plotH
  const coords = points.map((p, i) => [xAt(i), yAt(p.value)] as const)
  const line = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const lastX = coords[coords.length - 1]![0]
  const lastY = coords[coords.length - 1]![1]
  const baseY = PAD_T + plotH
  const area = `${line} L${lastX.toFixed(1)} ${baseY} L${PAD_L} ${baseY} Z`
  const last = points[points.length - 1]!
  const first = points[0]!

  return (
    <figure className={cx('m-0', className)} dir="ltr">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block h-auto w-full overflow-visible"
        role="img"
        aria-label={`${label}: ${formatValue(first.value)} → ${formatValue(last.value)}`}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--color-accent)', stopOpacity: 0.28 }} />
            <stop offset="1" style={{ stopColor: 'var(--color-accent)', stopOpacity: 0 }} />
          </linearGradient>
        </defs>

        {/* min / max guide lines */}
        {[max, min].map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R + 6}
              y1={yAt(v)}
              y2={yAt(v)}
              className="stroke-line-strong"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
            <text
              x={W - PAD_R + 12}
              y={yAt(v) + 4}
              className="fill-faint text-[11px] tabular-nums"
            >
              {formatValue(v)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gid})`} />
        <path
          d={line}
          fill="none"
          className="stroke-accent"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.slice(0, -1).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.5" className="fill-surface stroke-accent" strokeWidth="1.5" />
        ))}

        {/* emphasised last point */}
        <circle cx={lastX} cy={lastY} r="9" className="fill-accent" opacity="0.2" />
        <circle cx={lastX} cy={lastY} r="5" className="fill-accent stroke-bg" strokeWidth="2" />
        <text
          x={lastX}
          y={lastY - 14}
          textAnchor="middle"
          className="fill-text text-[13px] font-bold tabular-nums"
        >
          {formatValue(last.value)}
        </text>

        {/* x labels: first and last only */}
        <text x={PAD_L} y={height - 6} className="fill-muted text-[11px]">
          {first.label}
        </text>
        <text x={lastX} y={height - 6} textAnchor="end" className="fill-muted text-[11px]">
          {last.label}
        </text>
      </svg>
    </figure>
  )
}
