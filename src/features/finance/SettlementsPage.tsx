import { useState } from 'react'
import {
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  PageContainer,
  PageHeader,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatMoney, formatPeriod } from '@/lib/format'
import { paymentsService, type SettlementDetail } from '@/services'
import { FinanceTabs } from './FinanceTabs'

const STATUS_META = {
  pending: { label: 'Pendiente', tone: 'attention' as const },
  paid: { label: 'Liquidada', tone: 'positive' as const },
}

const columns: Column<SettlementDetail>[] = [
  {
    key: 'code',
    header: 'Liquidación',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.settlement.code}</span>
        <span className="text-xs text-slate-500 capitalize">{formatPeriod(row.settlement.period)}</span>
      </span>
    ),
  },
  { key: 'owner', header: 'Propietario', render: (row) => row.ownerName },
  {
    key: 'property',
    header: 'Propiedad',
    hideBelow: 'md',
    render: (row) => (
      <span className="flex flex-col">
        <span className="line-clamp-1">{row.propertyLabel}</span>
        <span className="text-xs text-slate-500">{row.rentalCode}</span>
      </span>
    ),
  },
  {
    key: 'total',
    header: 'A liquidar',
    align: 'right',
    render: (row) => <span className="font-medium tabular-nums">{formatMoney(row.settlement.total)}</span>,
  },
  { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={STATUS_META[row.settlement.status]} /> },
  {
    key: 'paidAt',
    header: 'Pagada',
    hideBelow: 'lg',
    render: (row) => <span className="text-slate-600">{formatDate(row.settlement.paidAt)}</span>,
  },
]

export function SettlementsPage() {
  const [status, setStatus] = useState('all')
  const list = useAsync(() => paymentsService.settlements(), [])
  const rows = (list.data ?? []).filter((row) => status === 'all' || row.settlement.status === status)

  return (
    <PageContainer>
      <PageHeader
        title="Finanzas"
        description="Liquidaciones a propietarios: alquiler cobrado menos comisión y gastos."
      />
      <FinanceTabs />
      <Card>
        <FilterBar onClear={() => setStatus('all')} activeCount={status === 'all' ? 0 : 1}>
          <FilterSelect
            label="Estado"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'Todas' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'paid', label: 'Liquidadas' },
            ]}
          />
        </FilterBar>
        <DataTable
          caption="Listado de liquidaciones"
          columns={columns}
          rows={rows}
          getRowId={(row) => row.settlement.id}
          rowHref={(row) => `/finanzas/liquidaciones/${row.settlement.id}`}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay liquidaciones con ese estado"
        />
      </Card>
    </PageContainer>
  )
}
