import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface DescriptionItem {
  label: string
  value: ReactNode
  /** Spans the full width, for long text such as notes. */
  wide?: boolean
}

export interface DescriptionListProps {
  items: DescriptionItem[]
  columns?: 2 | 3 | 4
  className?: string
}

const COLUMN_CLASSES = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
} as const

export function DescriptionList({ items, columns = 3, className }: DescriptionListProps) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-3', COLUMN_CLASSES[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className={cn('min-w-0', item.wide && 'sm:col-span-full')}>
          <dt className="text-2xs font-medium tracking-wide text-slate-500 uppercase">
            {item.label}
          </dt>
          <dd className="mt-0.5 text-sm text-slate-800">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
