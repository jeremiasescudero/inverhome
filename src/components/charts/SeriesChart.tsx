import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS_TICK, CHART_INK } from './palette'

export interface SeriesSpec {
  /** Key present in every datum. */
  key: string
  label: string
  color: string
}

export interface SeriesChartProps {
  data: Record<string, string | number>[]
  series: SeriesSpec[]
  /** Datum field used for the category axis. **/
  labelKey?: string
  height?: number
  formatValue?: (value: number) => string
  formatAxis?: (value: number) => string
}

interface TooltipPayloadItem {
  name?: string
  value?: number
  color?: string
}

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  formatValue: (value: number) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <p className="text-2xs font-medium text-slate-500">{label}</p>
      <ul className="mt-1 space-y-0.5">
        {payload.map((item) => (
          <li key={item.name} className="flex items-center gap-1.5 text-xs text-slate-700">
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="text-slate-500">{item.name}</span>
            <span className="ml-auto font-medium tabular-nums">
              {formatValue(item.value ?? 0)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const defaultFormat = (value: number) => value.toLocaleString('es-AR')

/** Grouped vertical bars for period comparisons. */
export function BarSeriesChart({
  data,
  series,
  labelKey = 'label',
  height = 240,
  formatValue = defaultFormat,
  formatAxis,
}: SeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }} barGap={2}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.axis }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={formatAxis ?? formatValue}
        />
        <Tooltip
          cursor={{ fill: 'rgba(15, 23, 42, 0.04)' }}
          content={<ChartTooltip formatValue={formatValue} />}
        />
        {series.map((item) => (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.label}
            fill={item.color}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Line chart for evolution over time. */
export function LineSeriesChart({
  data,
  series,
  labelKey = 'label',
  height = 240,
  formatValue = defaultFormat,
  formatAxis,
}: SeriesChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey={labelKey}
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={{ stroke: CHART_INK.axis }}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={formatAxis ?? formatValue}
        />
        <Tooltip content={<ChartTooltip formatValue={formatValue} />} />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={2}
            dot={{ r: 4, fill: item.color, strokeWidth: 0 }}
            activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
