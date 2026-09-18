import { cn } from '@/lib/cn'

export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn('app-scrollbar flex gap-1 overflow-x-auto border-b border-slate-200', className)}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-brand-600 font-medium text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'ml-1.5 rounded px-1 py-0.5 text-2xs',
                  isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
