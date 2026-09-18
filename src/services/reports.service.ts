import { db } from '@/mocks/db'
import { formatPeriod } from '@/lib/format'
import {
  leadSourceLabels,
  leadStageMeta,
  leadStageOrder,
  operationKindLabels,
  propertyStatusMeta,
  propertyTypeLabels,
} from '@/lib/labels'
import type { Id } from '@/types'
import { respond } from './api'
import { MOCK_USD_ARS } from './finance.service'

export interface CategoryDatum {
  key: string
  label: string
  value: number
}

export interface SeriesDatum {
  period: string
  label: string
  [metric: string]: string | number
}

export interface AgentPerformanceRow {
  agentId: Id
  agentName: string
  properties: number
  leads: number
  visits: number
  closedOperations: number
  conversionRate: number
}

export interface PropertyReports {
  byType: CategoryDatum[]
  byOperation: CategoryDatum[]
  byStatus: CategoryDatum[]
  priceEvolution: SeriesDatum[]
}

export interface CommercialReports {
  leadsBySource: CategoryDatum[]
  funnel: CategoryDatum[]
  visitsByMonth: SeriesDatum[]
  agentPerformance: AgentPerformanceRow[]
}

export interface FinancialReports {
  incomeByMonth: SeriesDatum[]
  commissionsByType: CategoryDatum[]
  rentStatus: CategoryDatum[]
}

function countBy<T, K extends string>(
  items: T[],
  key: (item: T) => K,
  labels: Record<K, string> | ((key: K) => string),
): CategoryDatum[] {
  const counts = new Map<K, number>()
  for (const item of items) {
    const bucket = key(item)
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([bucket, value]) => ({
      key: bucket,
      label: typeof labels === 'function' ? labels(bucket) : labels[bucket],
      value,
    }))
    .sort((a, b) => b.value - a.value)
}

/**
 * Average listing price per month, in thousands of USD. Sale prices are used
 * as-is and rent prices converted with the demo rate, which is why the chart
 * is labelled as an approximation in the UI.
 */
function priceEvolution(): SeriesDatum[] {
  const periods = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09']
  return periods.map((period) => {
    const listed = db.properties.filter((property) => property.createdAt <= `${period}-28`)
    const sale = listed.filter(
      (property) => property.operation === 'sale' || property.operation === 'sale_rent',
    )
    const average =
      sale.length === 0
        ? 0
        : sale.reduce(
            (total, property) =>
              total +
              (property.price.currency === 'USD'
                ? property.price.amount
                : property.price.amount / MOCK_USD_ARS),
            0,
          ) / sale.length

    return {
      period,
      label: formatPeriod(period),
      promedio: Math.round(average / 1000),
    }
  })
}

export const reportsService = {
  properties(): Promise<PropertyReports> {
    return respond({
      byType: countBy(db.properties, (property) => property.type, propertyTypeLabels),
      byOperation: countBy(db.properties, (property) => property.operation, operationKindLabels),
      byStatus: countBy(
        db.properties,
        (property) => property.status,
        (status) => propertyStatusMeta[status].label,
      ),
      priceEvolution: priceEvolution(),
    })
  },

  commercial(): Promise<CommercialReports> {
    const funnel: CategoryDatum[] = leadStageOrder.map((stage) => ({
      key: stage,
      label: leadStageMeta[stage].label,
      value: db.leads.filter((lead) => lead.stage === stage).length,
    }))

    const visitMonths = ['2026-06', '2026-07', '2026-08', '2026-09']
    const visitsByMonth: SeriesDatum[] = visitMonths.map((period) => ({
      period,
      label: formatPeriod(period),
      realizadas: db.visits.filter(
        (visit) => visit.date.startsWith(period) && visit.status === 'done',
      ).length,
      programadas: db.visits.filter((visit) => visit.date.startsWith(period)).length,
    }))

    const agentPerformance: AgentPerformanceRow[] = db.users
      .filter((user) => user.isAgent)
      .map((agent) => {
        const leads = db.leads.filter((lead) => lead.agentId === agent.id)
        const won = leads.filter((lead) => lead.stage === 'won').length
        return {
          agentId: agent.id,
          agentName: agent.name,
          properties: db.properties.filter((property) => property.agentId === agent.id).length,
          leads: leads.length,
          visits: db.visits.filter((visit) => visit.agentId === agent.id).length,
          closedOperations: db.operations.filter(
            (operation) => operation.agentId === agent.id && operation.status === 'closed',
          ).length,
          conversionRate: leads.length === 0 ? 0 : Math.round((won / leads.length) * 100),
        }
      })
      .sort((a, b) => b.closedOperations - a.closedOperations)

    return respond({
      leadsBySource: countBy(db.leads, (lead) => lead.source, leadSourceLabels),
      funnel,
      visitsByMonth,
      agentPerformance,
    })
  },

  financial(): Promise<FinancialReports> {
    const periods = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09']

    const incomeByMonth: SeriesDatum[] = periods.map((period) => ({
      period,
      label: formatPeriod(period),
      cobrado: db.payments
        .filter((payment) => payment.period === period && payment.status !== 'pending')
        .reduce((total, payment) => total + (payment.paidAmount?.amount ?? 0), 0),
      pendiente: db.payments
        .filter((payment) => payment.period === period && payment.status !== 'paid')
        .reduce(
          (total, payment) => total + payment.amount.amount - (payment.paidAmount?.amount ?? 0),
          0,
        ),
    }))

    const closed = db.operations.filter((operation) => operation.status === 'closed')
    const commissionsByType: CategoryDatum[] = [
      {
        key: 'sale',
        label: 'Venta',
        value: Math.round(
          closed
            .filter((operation) => operation.type === 'sale')
            .reduce(
              (total, operation) =>
                total +
                (operation.commission.currency === 'USD'
                  ? operation.commission.amount * MOCK_USD_ARS
                  : operation.commission.amount),
              0,
            ),
        ),
      },
      {
        key: 'rent',
        label: 'Alquiler',
        value: Math.round(
          closed
            .filter((operation) => operation.type === 'rent')
            .reduce((total, operation) => total + operation.commission.amount, 0),
        ),
      },
    ]

    const rentStatus: CategoryDatum[] = [
      {
        key: 'paid',
        label: 'Cobrado',
        value: db.payments.filter((payment) => payment.status === 'paid').length,
      },
      {
        key: 'pending',
        label: 'Pendiente',
        value: db.payments.filter((payment) => payment.status === 'pending').length,
      },
      {
        key: 'partial',
        label: 'Parcial',
        value: db.payments.filter((payment) => payment.status === 'partial').length,
      },
      {
        key: 'overdue',
        label: 'Vencido',
        value: db.payments.filter((payment) => payment.status === 'overdue').length,
      },
    ]

    return respond({ incomeByMonth, commissionsByType, rentStatus })
  },
}
