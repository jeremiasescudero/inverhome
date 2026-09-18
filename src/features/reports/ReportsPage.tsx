import { useState } from 'react'
import { BarSeriesChart, CategoryBarList, ChartCard, LineSeriesChart, SERIES, STATUS_COLORS } from '@/components/charts'
import {
  Card,
  CardBody,
  CardHeader,
  DataTable,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  Tabs,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatMoney, formatMoneyCompact, formatNumber, formatPercent } from '@/lib/format'
import { reportsService, type AgentPerformanceRow } from '@/services'

type TabId = 'properties' | 'commercial' | 'financial'

const ars = (amount: number) => formatMoney({ amount, currency: 'ARS' })
const arsCompact = (amount: number) => formatMoneyCompact({ amount, currency: 'ARS' })

const RENT_STATUS_COLOR: Record<string, string> = {
  paid: STATUS_COLORS.good,
  pending: STATUS_COLORS.warning,
  partial: STATUS_COLORS.serious,
  overdue: STATUS_COLORS.critical,
}

const agentColumns: Column<AgentPerformanceRow>[] = [
  { key: 'agent', header: 'Agente', render: (row) => <span className="font-medium text-slate-900">{row.agentName}</span> },
  { key: 'properties', header: 'Propiedades', align: 'right', render: (row) => formatNumber(row.properties) },
  { key: 'leads', header: 'Leads', align: 'right', render: (row) => formatNumber(row.leads) },
  { key: 'visits', header: 'Visitas', align: 'right', render: (row) => formatNumber(row.visits) },
  { key: 'closed', header: 'Op. cerradas', align: 'right', render: (row) => formatNumber(row.closedOperations) },
  {
    key: 'conversion',
    header: 'Conversión',
    align: 'right',
    render: (row) => <span className="tabular-nums">{formatPercent(row.conversionRate, 0)}</span>,
  },
]

export function ReportsPage() {
  const [tab, setTab] = useState<TabId>('properties')
  const properties = useAsync(() => reportsService.properties(), [])
  const commercial = useAsync(() => reportsService.commercial(), [])
  const financial = useAsync(() => reportsService.financial(), [])

  return (
    <PageContainer>
      <PageHeader title="Reportes" description="Indicadores de cartera, actividad comercial y resultados financieros." />

      <Tabs
        active={tab}
        onChange={(next) => setTab(next as TabId)}
        items={[
          { id: 'properties', label: 'Propiedades' },
          { id: 'commercial', label: 'Comercial' },
          { id: 'financial', label: 'Financiero' },
        ]}
      />

      {tab === 'properties' && (
        <>
          {properties.loading && <LoadingState rows={4} />}
          {properties.error && <ErrorState description={properties.error.message} onRetry={properties.reload} />}
          {properties.data && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard title="Propiedades por tipo">
                <CategoryBarList data={properties.data.byType} />
              </ChartCard>
              <ChartCard title="Propiedades por operación">
                <CategoryBarList data={properties.data.byOperation} />
              </ChartCard>
              <ChartCard title="Propiedades por estado">
                <CategoryBarList data={properties.data.byStatus} />
              </ChartCard>
              <ChartCard
                title="Evolución del precio promedio de venta"
                description="Miles de USD, cartera publicada al cierre de cada mes."
                footnote="Aproximación para la demo: promedio simple de los precios de lista."
              >
                <LineSeriesChart
                  data={properties.data.priceEvolution}
                  series={[{ key: 'promedio', label: 'Promedio (miles USD)', color: SERIES.blue }]}
                  formatValue={(value) => `USD ${formatNumber(value)} mil`}
                  formatAxis={(value) => `${formatNumber(value)}k`}
                />
              </ChartCard>
            </div>
          )}
        </>
      )}

      {tab === 'commercial' && (
        <>
          {commercial.loading && <LoadingState rows={4} />}
          {commercial.error && <ErrorState description={commercial.error.message} onRetry={commercial.reload} />}
          {commercial.data && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard title="Embudo de leads" description="Cantidad de leads en cada etapa.">
                <CategoryBarList data={commercial.data.funnel} />
              </ChartCard>
              <ChartCard title="Leads por origen">
                <CategoryBarList data={commercial.data.leadsBySource} />
              </ChartCard>
              <ChartCard
                title="Visitas por mes"
                legend={[
                  { label: 'Programadas', color: SERIES.blue },
                  { label: 'Realizadas', color: SERIES.aqua },
                ]}
              >
                <BarSeriesChart
                  data={commercial.data.visitsByMonth}
                  series={[
                    { key: 'programadas', label: 'Programadas', color: SERIES.blue },
                    { key: 'realizadas', label: 'Realizadas', color: SERIES.aqua },
                  ]}
                />
              </ChartCard>
              <Card>
                <CardHeader title="Rendimiento por agente" description="Conversión = leads convertidos sobre leads totales." />
                <CardBody className="px-0 py-0">
                  <DataTable
                    caption="Rendimiento por agente"
                    columns={agentColumns}
                    rows={commercial.data.agentPerformance}
                    getRowId={(row) => row.agentId}
                  />
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}

      {tab === 'financial' && (
        <>
          {financial.loading && <LoadingState rows={4} />}
          {financial.error && <ErrorState description={financial.error.message} onRetry={financial.reload} />}
          {financial.data && (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard
                title="Cobranza de alquileres por mes"
                className="lg:col-span-2"
                legend={[
                  { label: 'Cobrado', color: SERIES.blue },
                  { label: 'Pendiente', color: SERIES.orange },
                ]}
              >
                <BarSeriesChart
                  data={financial.data.incomeByMonth}
                  series={[
                    { key: 'cobrado', label: 'Cobrado', color: SERIES.blue },
                    { key: 'pendiente', label: 'Pendiente', color: SERIES.orange },
                  ]}
                  formatValue={ars}
                  formatAxis={arsCompact}
                />
              </ChartCard>
              <ChartCard title="Comisiones por tipo de operación" description="Operaciones cerradas, en pesos.">
                <CategoryBarList data={financial.data.commissionsByType} formatValue={ars} />
              </ChartCard>
              <ChartCard title="Estado de los pagos de alquiler" description="Cantidad de pagos por estado.">
                <CategoryBarList
                  data={financial.data.rentStatus.map((datum) => ({ ...datum, color: RENT_STATUS_COLOR[datum.key] }))}
                />
              </ChartCard>
            </div>
          )}
        </>
      )}
    </PageContainer>
  )
}
