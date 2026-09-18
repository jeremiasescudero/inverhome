import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { EmptyState, ErrorState, LoadingState } from './States'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  className?: string
  /** Columns hidden on narrow viewports keep the table readable on tablets. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface SortState {
  by: string
  dir: 'asc' | 'desc'
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  /** Navigating on row click keeps lists and detail pages consistent. */
  rowHref?: (row: T) => string
  /** Alternative to rowHref for quick views (drawers) that keep the list. */
  onRowClick?: (row: T) => void
  sort?: SortState
  onSortChange?: (sort: SortState) => void
  loading?: boolean
  error?: Error
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  caption: string
}

const HIDE_CLASSES: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

const ALIGN_CLASSES = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowHref,
  onRowClick,
  sort,
  onSortChange,
  loading,
  error,
  onRetry,
  emptyTitle = 'Sin resultados',
  emptyDescription = 'Probá ajustar la búsqueda o los filtros aplicados.',
  emptyAction,
  caption,
}: DataTableProps<T>) {
  const navigate = useNavigate()

  if (error) return <ErrorState description={error.message} onRetry={onRetry} />
  if (loading) return <LoadingState />
  if (rows.length === 0) {
    return (
      <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
    )
  }

  function toggleSort(key: string) {
    if (!onSortChange) return
    const nextDir = sort?.by === key && sort.dir === 'asc' ? 'desc' : 'asc'
    onSortChange({ by: key, dir: nextDir })
  }

  return (
    <div className="app-scrollbar overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {columns.map((column) => {
              const isSorted = sort?.by === column.key
              const SortIcon = !isSorted
                ? ChevronsUpDown
                : sort.dir === 'asc'
                  ? ArrowUp
                  : ArrowDown
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined
                  }
                  className={cn(
                    'px-3 py-2 text-2xs font-semibold tracking-wide text-slate-500 uppercase',
                    ALIGN_CLASSES[column.align ?? 'left'],
                    column.hideBelow && HIDE_CLASSES[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.sortable && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.key)}
                      className="inline-flex items-center gap-1 rounded text-2xs font-semibold tracking-wide uppercase hover:text-slate-800"
                    >
                      {column.header}
                      <SortIcon className="size-3" aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row)
            const clickable = Boolean(href || onRowClick)
            return (
              <tr
                key={getRowId(row)}
                onClick={
                  clickable
                    ? () => (onRowClick ? onRowClick(row) : navigate(href!))
                    : undefined
                }
                className={cn(
                  'border-b border-slate-100 last:border-0',
                  clickable && 'cursor-pointer hover:bg-brand-50/40',
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-3 py-2.5 align-middle text-slate-700',
                      ALIGN_CLASSES[column.align ?? 'left'],
                      column.hideBelow && HIDE_CLASSES[column.hideBelow],
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
