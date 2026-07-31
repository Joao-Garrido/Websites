import type { Insight } from '../analysis/report'
import { cx } from './ui'

export function MetricTile({ insight }: { insight: Insight }) {
  const tone =
    insight.verdict === 'watch'
      ? 'text-amber-warm'
      : insight.verdict === 'good'
        ? 'text-sage-300'
        : 'text-fg-dim'

  return (
    <div className="surface flex flex-col gap-1.5 rounded-2xl p-4">
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.16em] text-fg-faint">
        {insight.label}
      </p>
      <p className={cx('font-display text-2xl leading-none', tone)}>
        {insight.value}
      </p>
      {insight.note && (
        <p className="text-sm leading-snug text-fg-dim">{insight.note}</p>
      )}
      {insight.caveat && (
        <p className="mt-0.5 text-xs leading-snug text-fg-faint">{insight.caveat}</p>
      )}
    </div>
  )
}

/** Inline SVG sparkline — no charting library for four numbers. */
export function Sparkline({
  values,
  width = 120,
  height = 32,
}: {
  values: number[]
  width?: number
  height?: number
}) {
  if (values.length < 2) {
    return <div style={{ width, height }} aria-hidden="true" />
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / span) * (height - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${values.length} values, from ${values[0]} to ${values[values.length - 1]}`}
      className="overflow-visible"
    >
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-sage-400/80"
      />
      <circle
        cx={(values.length - 1) * stepX}
        cy={height - ((values[values.length - 1]! - min) / span) * (height - 4) - 2}
        r="2.5"
        className="fill-sage-300"
      />
    </svg>
  )
}

export function StreakRing({ days }: { days: number }) {
  const size = 68
  const r = 28
  const c = 2 * Math.PI * r
  // A full ring at seven days; beyond that it simply stays full.
  const progress = Math.min(days / 7, 1)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="3"
          className="stroke-white/8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="stroke-sage-400 transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-xl text-fg">
        {days}
      </span>
    </div>
  )
}
