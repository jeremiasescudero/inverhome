import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '@/lib/format'
import { Button } from './Button'

export interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  itemLabel = 'registros',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-2.5"
      aria-label="Paginación"
    >
      <p className="text-xs text-slate-500">
        {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          icon={<ChevronLeft className="size-3.5" aria-hidden="true" />}
        >
          Anterior
        </Button>
        <span className="px-2 text-xs text-slate-500" aria-current="page">
          {page} / {totalPages}
        </span>
        <Button size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Siguiente
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
