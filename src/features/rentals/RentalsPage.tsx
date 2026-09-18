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
import { rentalStatusMeta } from '@/lib/labels'
import { rentalsService, type RentalListItem } from '@/services'
import type { RentalFilters, RentalStatus } from '@/types'

const columns: Column<RentalListItem>[] = [
  {
    key: 'property',
    header: 'Contrato',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.propertyTitle}</span>
        <span className="text-xs text-slate-500">{row.code}</span>
      </span>
    ),
  },
  { key: 'owner', header: 'Propietario', hideBelow: 'lg', render: (row) => row.ownerName },
  { key: 'tenant', header: 'Inquilino', hideBelow: 'md', render: (row) => row.tenantName },
  {
    key: 'amount',
    header: 'Monto',
    align: 'right',
    render: (row) => <span className="font-medium tabular-nums">{formatMoney(row.monthlyAmount)}</span>,
  },
  {
    key: 'adjustment',
    header: 'Próx. actualización',
    hideBelow: 'xl',
    render: (row) => <span className="text-slate-600">{formatDate(row.nextAdjustmentDate)}</span>,
  },
  {
    key: 'endDate',
    header: 'Vencimiento',
    render: (row) => (
      <span className="flex flex-col">
        <span className="text-slate-800">{formatDate(row.endDate)}</span>
        {row.status !== 'finished' && (
          <span className="text-xs text-slate-500">
            {row.daysToExpiry < 0 ? `Hace ${Math.abs(row.daysToExpiry)} días` : `En ${row.daysToExpiry} días`}
          </span>
        )}
      </span>
    ),
  },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={rentalStatusMeta[row.status]} /> },
  {
    key: 'payments',
    header: 'Pagos',
    hideBelow: 'lg',
    render: (row) => (
      <span className="flex flex-wrap gap-1">
        {row.overduePayments > 0 && <Badge tone="critical">{row.overduePayments} vencidos</Badge>}
        {row.pendingPayments > 0 && <Badge tone="attention">{row.pendingPayments} pendientes</Badge>}
        {row.overduePayments === 0 && row.pendingPayments === 0 && <Badge tone="positive">Al día</Badge>}
      </span>
    ),
  },
]

export function RentalsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<RentalFilters>(
    () => ({ search: debouncedSearch, status: status as RentalStatus | 'all' }),
    [debouncedSearch, status],
  )
  const list = useAsync(() => rentalsService.list(filters, { page }), [filters, page])

  return (
    <PageContainer>
      <PageHeader
        title="Alquileres"
        description="Contratos de locación administrados por la inmobiliaria, ordenados por vencimiento."
      />
      <Card>
        <FilterBar
          lead={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder="Buscar por contrato, propiedad, propietario o inquilino…"
            />
          }
          onClear={() => {
            setStatus('all')
            setPage(1)
          }}
          activeCount={status === 'all' ? 0 : 1}
        >
          <FilterSelect
            label="Estado"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(rentalStatusMeta) as RentalStatus[]).map((key) => ({
                value: key,
                label: rentalStatusMeta[key].label,
              })),
            ]}
          />
        </FilterBar>
        <DataTable
          caption="Listado de contratos de alquiler"
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(row) => row.id}
          rowHref={(row) => `/alquileres/${row.id}`}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay contratos con esos criterios"
        />
        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="contratos"
          />
        )}
      </Card>
    </PageContainer>
  )
}
