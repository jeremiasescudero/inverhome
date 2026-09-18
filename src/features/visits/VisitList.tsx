import { DataTable, Pagination, StatusBadge, type Column } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { visitOutcomeLabels, visitStatusMeta } from '@/lib/labels'
import type { VisitListItem } from '@/services'
import type { Page } from '@/types'

export interface VisitListProps {
  page: Page<VisitListItem> | undefined
  loading: boolean
  error?: Error
  onRetry: () => void
  onPageChange: (page: number) => void
  onSelect: (id: string) => void
}

const columns: Column<VisitListItem>[] = [
  {
    key: 'when',
    header: 'Fecha',
    render: (row) => (
      <span className="tabular-nums">
        <span className="font-medium text-slate-900">{formatDate(row.date)}</span>{' '}
        <span className="text-slate-500">{row.time}</span>
      </span>
    ),
  },
  {
    key: 'property',
    header: 'Propiedad',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.propertyTitle}</span>
        <span className="truncate text-xs text-slate-500">{row.propertyAddress}</span>
      </span>
    ),
  },
  { key: 'person', header: 'Cliente', hideBelow: 'md', render: (row) => row.personName },
  { key: 'agent', header: 'Agente', hideBelow: 'lg', render: (row) => row.agentName },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={visitStatusMeta[row.status]} /> },
  {
    key: 'outcome',
    header: 'Resultado',
    hideBelow: 'xl',
    render: (row) => (
      <span className="text-slate-600">{row.outcome ? visitOutcomeLabels[row.outcome] : '—'}</span>
    ),
  },
]

export function VisitList({ page, loading, error, onRetry, onPageChange, onSelect }: VisitListProps) {
  return (
    <>
      <DataTable
        caption="Historial de visitas"
        columns={columns}
        rows={page?.items ?? []}
        getRowId={(row) => row.id}
        onRowClick={(row) => onSelect(row.id)}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No hay visitas con esos criterios"
      />
      {page && (
        <Pagination
          page={page.page}
          pageSize={page.pageSize}
          total={page.total}
          onPageChange={onPageChange}
          itemLabel="visitas"
        />
      )}
    </>
  )
}
