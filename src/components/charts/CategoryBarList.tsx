import { formatNumber } from '@/lib/format'
import { SERIES } from './palette'

export interface CategoryBarDatum {
  key: string
  label: string
  value: number
  /** Overrides the default single-hue fill, e.g. for status breakdowns. */
  color?: string
}

export interface CategoryBarListProps {
  data: CategoryBarDatum[]
  /** Every row prints its value, which is also what satisfies the relief rule
   *  for fills below 3:1 contrast. */
  formatValue?: (value: number) => string
  emptyLabel?: string
}

/**
 * Horizontal bars for categorical breakdowns. Plain HTML rather than a chart
 * library: labels never collide, the values are real text, and it degrades to
 * a readable list at any width.
 */
export function CategoryBarList({
  data,
  formatValue = formatNumber,
  emptyLabel = 'Sin datos',
}: CategoryBarListProps) {
  const max = Math.max(...data.map((datum) => datum.value), 1)

  if (data.length === 0) {
    return <p className="px-2 py-6 text-center text-xs text-slate-500">{emptyLabel}</p>
  }

  return (
    <ul className="space-y-2 px-2">
      {data.map((datum) => (
        <li key={datum.key} className="grid grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-2">
          <span className="truncate text-xs text-slate-600" title={datum.label}>
            {datum.label}
          </span>
          <span className="h-4 w-full overflow-hidden rounded-sm bg-slate-100">
            <span
              className="block h-full rounded-sm"
              style={{
                width: `${Math.max((datum.value / max) * 100, datum.value > 0 ? 4 : 0)}%`,
                backgroundColor: datum.color ?? SERIES.blue,
              }}
            />
          </span>
          <span className="w-12 text-right text-xs font-medium tabular-nums text-slate-700">
            {formatValue(datum.value)}
          </span>
        </li>
      ))}
    </ul>
  )
}
