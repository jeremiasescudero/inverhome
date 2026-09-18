import { ArrowDownRight, ArrowUpRight, Banknote, Landmark, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { BarSeriesChart, ChartCard, SERIES } from '@/components/charts'
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageContainer,
  PageHeader,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatMoney, formatMoneyCompact, formatNumber, formatPeriod } from '@/lib/format'
import { financeService, MOCK_USD_ARS, type CommissionRow, type PendingSettlementRow } from '@/services'
import { FinanceTabs } from './FinanceTabs'

const ars = (amount: number) => formatMoney({ amount, currency: 'ARS' })
const arsCompact = (amount: number) => formatMoneyCompact({ amount, currency: 'ARS' })

const commissionColumns: Column<CommissionRow>[] = [
  { key: 'agent', header: 'Agente', render: (row) => <span className="font-medium text-slate-900">{row.agentName}</span> },
  {
    key: 'operations',
    header: 'Operaciones cerradas',
    align: 'right',
    render: (row) => <span className="tabular-nums">{formatNumber(row.operations)}</span>,
  },
  {
    key: 'commission',
    header: 'Comisiones (ARS equiv.)',
    align: 'right',
    render: (row) => <span className="font-medium tabular-nums">{ars(row.commission)}</span>,
  },
]

const settlementColumns: Column<PendingSettlementRow>[] = [
  {
    key: 'code',
    header: 'Liquidación',
    render: (row) => (
      <span className="flex flex-col">
        <span className="font-medium text-slate-900">{row.code}</span>
        <span className="text-xs text-slate-500 capitalize">{formatPeriod(row.period)}</span>
      </span>
    ),
  },
  { key: 'owner', header: 'Propietario', render: (row) => row.ownerName },
  { key: 'property', header: 'Propiedad', hideBelow: 'md', render: (row) => <span className="line-clamp-1">{row.propertyLabel}</span> },
  {
    key: 'total',
    header: 'A liquidar',
    align: 'right',
    render: (row) => <span className="font-medium tabular-nums">{formatMoney(row.total)}</span>,
  },
]

export function FinancePage() {
  const { user, can } = useSession()
  const fullAccess = can('finance.view')
  const summary = useAsync(() => financeService.summary(), [])
  const flow = useAsync(() => financeService.monthlyFlow(6), [])
  const commissions = useAsync(() => financeService.commissionsByAgent(), [])
  const pending = useAsync(() => financeService.pendingSettlements(), [])

  // Agents only see their own commissions (spec section 3).
  const commissionRows = fullAccess
    ? (commissions.data ?? [])
    : (commissions.data ?? []).filter((row) => row.agentId === user.id)

  return (
    <PageContainer>
      <PageHeader
        title="Finanzas"
        description={
          fullAccess
            ? 'Ingresos, egresos, comisiones y dinero a liquidar a propietarios.'
            : 'Comisiones generadas por tus operaciones cerradas.'
        }
      />
      <FinanceTabs />

      {fullAccess && (
        <>
          {summary.loading && <LoadingState rows={2} />}
          {summary.error && <ErrorState description={summary.error.message} onRetry={summary.reload} />}
          {summary.data && (
            <section aria-label="Resumen financiero" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              <KpiCard label="Ingresos" value={arsCompact(summary.data.income.amount)} hint="Comisiones + honorarios" icon={ArrowUpRight} tone="positive" />
              <KpiCard label="Egresos" value={arsCompact(summary.data.expenses.amount)} hint="Gastos de operaciones y propietarios" icon={ArrowDownRight} tone="critical" />
              <KpiCard label="Comisiones por ventas" value={arsCompact(summary.data.saleCommissions.amount)} icon={Wallet} />
              <KpiCard label="Alquileres cobrados" value={arsCompact(summary.data.rentCollected.amount)} icon={Banknote} tone="positive" />
              <KpiCard label="Alquileres pendientes" value={arsCompact(summary.data.rentPending.amount)} icon={Banknote} tone="attention" to="/finanzas/pagos?estado=pending" />
              <KpiCard label="A liquidar" value={arsCompact(summary.data.toSettle.amount)} hint="Pertenece a propietarios" icon={Landmark} tone="info" to="/finanzas/liquidaciones" />
            </section>
          )}

          <ChartCard
            title="Ingresos vs. egresos"
            description="Últimos seis meses, en pesos."
            legend={[
              { label: 'Ingresos', color: SERIES.blue },
              { label: 'Egresos', color: SERIES.orange },
            ]}
            footnote={`Las comisiones en USD se convierten a ARS con una cotización de referencia de ${formatNumber(MOCK_USD_ARS)} para la demo.`}
          >
            {flow.loading && <LoadingState rows={4} />}
            {flow.data && (
              <BarSeriesChart
                data={flow.data.map((row) => ({ label: row.label, ingresos: row.income, egresos: row.expenses }))}
                series={[
                  { key: 'ingresos', label: 'Ingresos', color: SERIES.blue },
                  { key: 'egresos', label: 'Egresos', color: SERIES.orange },
                ]}
                formatValue={ars}
                formatAxis={arsCompact}
              />
            )}
          </ChartCard>
        </>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={fullAccess ? 'Comisiones por agente' : 'Mis comisiones'}
            description="Operaciones cerradas."
          />
          <CardBody className="px-0 py-0">
            <DataTable
              caption="Comisiones por agente"
              columns={commissionColumns}
              rows={commissionRows}
              getRowId={(row) => row.agentId}
              loading={commissions.loading}
              error={commissions.error}
              onRetry={commissions.reload}
              emptyTitle="Sin operaciones cerradas"
            />
          </CardBody>
        </Card>

        {fullAccess && (
          <Card>
            <CardHeader
              title="Liquidaciones pendientes"
              description="Dinero cobrado que todavía no se entregó al propietario."
              actions={
                <Link to="/finanzas/liquidaciones" className="text-xs text-brand-700 hover:underline">
                  Ver todas
                </Link>
              }
            />
            <CardBody className="px-0 py-0">
              {pending.data && pending.data.length === 0 ? (
                <EmptyState title="No hay liquidaciones pendientes" />
              ) : (
                <DataTable
                  caption="Liquidaciones pendientes"
                  columns={settlementColumns}
                  rows={pending.data ?? []}
                  getRowId={(row) => row.id}
                  rowHref={(row) => `/finanzas/liquidaciones/${row.id}`}
                  loading={pending.loading}
                  error={pending.error}
                  onRetry={pending.reload}
                />
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
