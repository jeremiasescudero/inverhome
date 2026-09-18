import { Banknote } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import {
  Button,
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  KpiCard,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatPeriod } from '@/lib/format'
import { paymentMethodLabels, paymentStatusMeta } from '@/lib/labels'
import { financeService, paymentsService, type PaymentListItem } from '@/services'
import type { PaymentFilters, PaymentStatus } from '@/types'
import { FinanceTabs } from '@/features/finance/FinanceTabs'
import { RegisterPaymentModal, type RegisterPaymentTarget } from './RegisterPaymentModal'

export function PaymentsPage() {
  const { can } = useSession()
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(params.get('estado') ?? 'all')
  const [period, setPeriod] = useState('all')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<RegisterPaymentTarget | undefined>()
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<PaymentFilters>(
    () => ({ search: debouncedSearch, status: status as PaymentStatus | 'all', period }),
    [debouncedSearch, status, period],
  )

  const list = useAsync(() => paymentsService.list(filters, { page }), [filters, page])
  const periods = useAsync(() => paymentsService.periods(), [])
  const summary = useAsync(() => financeService.summary(), [list.data])
  const canManage = can('payments.manage')

  const columns: Column<PaymentListItem>[] = [
    {
      key: 'period',
      header: 'Período',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-slate-900 capitalize">{formatPeriod(row.period)}</span>
          <span className="text-xs text-slate-500">{row.code}</span>
        </span>
      ),
    },
    {
      key: 'property',
      header: 'Propiedad',
      render: (row) => (
        <span className="flex flex-col">
          <span className="line-clamp-1 text-slate-900">{row.propertyLabel}</span>
          <span className="text-xs text-slate-500">{row.rentalCode}</span>
        </span>
      ),
    },
    { key: 'tenant', header: 'Inquilino', hideBelow: 'md', render: (row) => row.tenantName },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      render: (row) => (
        <span className="flex flex-col items-end">
          <span className="font-medium tabular-nums">{formatMoney(row.amount)}</span>
          {row.status === 'partial' && row.paidAmount && (
            <span className="text-xs tabular-nums text-slate-500">Pagado {formatMoney(row.paidAmount)}</span>
          )}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Vencimiento',
      hideBelow: 'lg',
      render: (row) => <span className="text-slate-600">{formatDate(row.dueDate)}</span>,
    },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={paymentStatusMeta[row.status]} /> },
    {
      key: 'paid',
      header: 'Pago',
      hideBelow: 'xl',
      render: (row) =>
        row.paidAt ? (
          <span className="flex flex-col text-xs">
            <span className="text-slate-800">{formatDate(row.paidAt)}</span>
            <span className="text-slate-500">{row.method ? paymentMethodLabels[row.method] : ''}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (row: PaymentListItem) =>
              row.status !== 'paid' ? (
                <Button
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    setTarget(row)
                  }}
                  icon={<Banknote className="size-3.5" aria-hidden="true" />}
                >
                  Registrar
                </Button>
              ) : null,
          },
        ]
      : []),
  ]

  return (
    <PageContainer>
      <PageHeader title="Finanzas" description="Cobranza de alquileres por período." />
      <FinanceTabs />

      {summary.data && (
        <section aria-label="Resumen de cobranza" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Alquileres cobrados" value={formatMoneyCompact(summary.data.rentCollected)} icon={Banknote} tone="positive" />
          <KpiCard label="Pendiente de cobro" value={formatMoneyCompact(summary.data.rentPending)} icon={Banknote} tone="attention" />
          <KpiCard
            label="Pagos vencidos"
            value={formatNumber(summary.data.overdueCount)}
            icon={Banknote}
            tone={summary.data.overdueCount > 0 ? 'critical' : 'neutral'}
          />
          <KpiCard label="A liquidar a propietarios" value={formatMoneyCompact(summary.data.toSettle)} icon={Banknote} tone="info" />
        </section>
      )}

      <Card>
        <FilterBar
          lead={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder="Buscar por contrato, inquilino o propiedad…"
            />
          }
          onClear={() => {
            setStatus('all')
            setPeriod('all')
            setPage(1)
          }}
          activeCount={[status, period].filter((value) => value !== 'all').length}
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
              ...(Object.keys(paymentStatusMeta) as PaymentStatus[]).map((key) => ({
                value: key,
                label: paymentStatusMeta[key].label,
              })),
            ]}
          />
          <FilterSelect
            label="Período"
            value={period}
            onChange={(value) => {
              setPeriod(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(periods.data ?? []).map((value) => ({ value, label: formatPeriod(value) })),
            ]}
          />
        </FilterBar>
        <DataTable
          caption="Listado de pagos de alquiler"
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(row) => row.id}
          rowHref={(row) => `/alquileres/${row.rentalId}`}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay pagos con esos criterios"
        />
        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="pagos"
          />
        )}
      </Card>

      <RegisterPaymentModal payment={target} onClose={() => setTarget(undefined)} onRegistered={list.reload} />
    </PageContainer>
  )
}
