import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface ChartLegendItem {
  label: string
  color: string
}

export interface ChartCardProps {
  title: string
  description?: string
  /** Legend is always rendered for two or more series, so identity is never
   *  carried by colour alone. */
  legend?: ChartLegendItem[]
  footnote?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function ChartCard({
  title,
  description,
  legend,
  footnote,
  actions,
  children,
  className,
}: ChartCardProps) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {legend && legend.length > 1 && (
            <ul className="flex flex-wrap items-center gap-3">
              {legend.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
          {actions}
        </div>
      </header>
      <div className="px-2 py-3">{children}</div>
      {footnote && (
        <footer className="border-t border-slate-100 px-4 py-2">
          <p className="text-2xs text-slate-400">{footnote}</p>
        </footer>
      )}
    </section>
  )
}
