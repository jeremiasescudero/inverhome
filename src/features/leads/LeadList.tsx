import { Avatar, DataTable, Pagination, StatusBadge, type Column } from '@/components/ui'
import { formatDate, formatRelativeDate } from '@/lib/format'
import { leadPriorityMeta, leadSourceLabels, leadStageMeta } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import type { LeadListItem } from '@/services'
import type { Page } from '@/types'

export interface LeadListProps {
  page: Page<LeadListItem> | undefined
  loading: boolean
  error?: Error
  onRetry: () => void
  onPageChange: (page: number) => void
  onSelect: (id: string) => void
}

const columns: Column<LeadListItem>[] = [
  {
    key: 'person',
    header: 'Lead',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.personName}</span>
        <span className="text-xs text-slate-500">
          {row.code} · {row.personPhone}
        </span>
      </span>
    ),
  },
  {
    key: 'property',
    header: 'Interés',
    hideBelow: 'md',
    render: (row) => <span className="line-clamp-2 text-slate-700">{row.propertyLabel}</span>,
  },
  { key: 'stage', header: 'Etapa', render: (row) => <StatusBadge meta={leadStageMeta[row.stage]} /> },
  {
    key: 'priority',
    header: 'Prioridad',
    hideBelow: 'lg',
    render: (row) => <StatusBadge meta={leadPriorityMeta[row.priority]} showIcon={false} />,
  },
  {
    key: 'source',
    header: 'Origen',
    hideBelow: 'xl',
    render: (row) => <span className="text-slate-600">{leadSourceLabels[row.source]}</span>,
  },
  {
    key: 'agent',
    header: 'Agente',
    hideBelow: 'lg',
    render: (row) => (
      <span className="flex items-center gap-2">
        <Avatar name={row.agentName} color="bg-slate-400" />
        {row.agentName}
      </span>
    ),
  },
  {
    key: 'nextContact',
    header: 'Próximo contacto',
    render: (row) =>
      row.nextContactAt ? (
        <span className="text-slate-700">{formatRelativeDate(row.nextContactAt, new Date(DEMO_TODAY))}</span>
      ) : (
        <span className="text-xs text-amber-800">Sin agendar</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'Alta',
    hideBelow: 'xl',
    render: (row) => <span className="text-slate-500">{formatDate(row.createdAt)}</span>,
  },
]

export function LeadList({ page, loading, error, onRetry, onPageChange, onSelect }: LeadListProps) {
  return (
    <>
      <DataTable
        caption="Listado de leads"
        columns={columns}
        rows={page?.items ?? []}
        getRowId={(row) => row.id}
        onRowClick={(row) => onSelect(row.id)}
        loading={loading}
        error={error}
        onRetry={onRetry}
        emptyTitle="No hay leads con esos criterios"
      />
      {page && (
        <Pagination
          page={page.page}
          pageSize={page.pageSize}
          total={page.total}
          onPageChange={onPageChange}
          itemLabel="leads"
        />
      )}
    </>
  )
}
