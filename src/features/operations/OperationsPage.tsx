import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { formatDate, formatMoney } from '@/lib/format'
import { operationStatusMeta, operationTypeLabels } from '@/lib/labels'
import { operationsService, usersService, type OperationListItem } from '@/services'
import type { OperationFilters, OperationStatus, OperationType } from '@/types'

const columns: Column<OperationListItem>[] = [
  {
    key: 'code',
    header: 'Operación',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.code}</span>
        <span className="text-xs text-slate-500">{formatDate(row.startedAt)}</span>
      </span>
    ),
  },
  {
    key: 'property',
    header: 'Propiedad',
    render: (row) => (
      <span className="flex flex-col">
        <span className="line-clamp-1 text-slate-900">{row.propertyTitle}</span>
        <span className="text-xs text-slate-500">{row.propertyCode}</span>
      </span>
    ),
  },
  { key: 'type', header: 'Tipo', hideBelow: 'md', render: (row) => <Badge>{operationTypeLabels[row.type]}</Badge> },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={operationStatusMeta[row.status]} /> },
  {
    key: 'parties',
    header: 'Partes',
    hideBelow: 'lg',
    render: (row) => (
      <span className="flex flex-col text-xs">
        <span className="text-slate-800">{row.counterpartName}</span>
        <span className="text-slate-500">{row.principalName}</span>
      </span>
    ),
  },
  {
    key: 'price',
    header: 'Monto',
    align: 'right',
    render: (row) => <span className="font-medium tabular-nums">{formatMoney(row.price)}</span>,
  },
  {
    key: 'commission',
    header: 'Comisión',
    align: 'right',
    hideBelow: 'xl',
    render: (row) => <span className="tabular-nums text-slate-700">{formatMoney(row.commission)}</span>,
  },
  { key: 'agent', header: 'Agente', hideBelow: 'xl', render: (row) => row.agentName },
]

export function OperationsPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [agentId, setAgentId] = useState('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<OperationFilters>(
    () => ({
      search: debouncedSearch,
      type: type as OperationType | 'all',
      status: status as OperationStatus | 'all',
      agentId,
    }),
    [debouncedSearch, type, status, agentId],
  )

  const list = useAsync(() => operationsService.list(filters, { page }), [filters, page])
  const agents = useAsync(() => usersService.agents(), [])

  function update(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Operaciones"
        description="Ventas y alquileres en curso, desde la reserva hasta la firma."
      />

      <Card>
        <FilterBar
          lead={<SearchInput value={search} onChange={update(setSearch)} placeholder="Buscar por código, propiedad o parte…" />}
          onClear={() => {
            setType('all')
            setStatus('all')
            setAgentId('all')
            setPage(1)
          }}
          activeCount={[type, status, agentId].filter((value) => value !== 'all').length}
        >
          <FilterSelect
            label="Tipo"
            value={type}
            onChange={update(setType)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(operationTypeLabels) as OperationType[]).map((key) => ({
                value: key,
                label: operationTypeLabels[key],
              })),
            ]}
          />
          <FilterSelect
            label="Estado"
            value={status}
            onChange={update(setStatus)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(operationStatusMeta) as OperationStatus[]).map((key) => ({
                value: key,
                label: operationStatusMeta[key].label,
              })),
            ]}
          />
          <FilterSelect
            label="Agente"
            value={agentId}
            onChange={update(setAgentId)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(agents.data ?? []).map((agent) => ({ value: agent.id, label: agent.name })),
            ]}
          />
        </FilterBar>

        <DataTable
          caption="Listado de operaciones"
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(row) => row.id}
          rowHref={(row) => `/operaciones/${row.id}`}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay operaciones con esos criterios"
        />
        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="operaciones"
          />
        )}
      </Card>
    </PageContainer>
  )
}
