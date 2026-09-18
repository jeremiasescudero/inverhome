import { FilterX } from 'lucide-react'
import type { ReactNode } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import type { SelectOption } from './Field'

export interface FilterBarProps {
  children: ReactNode
  /** Rendered first and allowed to grow, normally the search input. */
  lead?: ReactNode
  onClear?: () => void
  activeCount?: number
  className?: string
}

export function FilterBar({
  children,
  lead,
  onClear,
  activeCount = 0,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-2 border-b border-slate-200 px-4 py-3',
        className,
      )}
    >
      {lead && <div className="min-w-48 flex-1">{lead}</div>}
      {children}
      {onClear && activeCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          icon={<FilterX className="size-3.5" aria-hidden="true" />}
        >
          Limpiar ({activeCount})
        </Button>
      )}
    </div>
  )
}

export interface FilterSelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

/** Compact labelled select used inside FilterBar. */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: FilterSelectProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-2xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export interface FilterNumberProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function FilterNumber({
  label,
  value,
  onChange,
  placeholder,
  className,
}: FilterNumberProps) {
  const id = useId()
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-2xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-28 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
      />
    </div>
  )
}
