import { db } from '@/mocks/db'
import { formatPeriod } from '@/lib/format'
import type { Id, Money } from '@/types'
import { respond } from './api'
import { personName, propertyLabel } from './support/refs'

/**
 * Demo conversion rate used to add USD sale commissions and ARS rent income
 * into a single series. A real system would store the rate that applied on
 * each operation date; this constant exists so the charts are readable and is
 * always labelled as an estimate in the UI (see docs/DECISIONS.md, ADR-004).
 */
export const MOCK_USD_ARS = 1350

function toArs(money: Money): number {
  return money.currency === 'USD' ? money.amount * MOCK_USD_ARS : money.amount
}

export interface FinanceSummary {
  /** Agency income: sale commissions plus rent management fees. */
  income: Money
  expenses: Money
  saleCommissions: Money
  rentCommissions: Money
  rentCollected: Money
  rentPending: Money
  /** Money held by the agency that belongs to owners. */
  toSettle: Money
  overdueCount: number
}

export interface MonthlyFlow {
  period: string
  label: string
  income: number
  expenses: number
}

export interface CommissionRow {
  agentId: Id
  agentName: string
  operations: number
  commission: number
}

export interface PendingSettlementRow {
  id: Id
  code: string
  ownerName: string
  propertyLabel: string
  period: string
  total: Money
}

const ars = (amount: number): Money => ({ amount: Math.round(amount), currency: 'ARS' })

function lastPeriods(count: number, reference = '2026-09'): string[] {
  const [year, month] = reference.split('-').map(Number)
  const periods: string[] = []
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(year, month - 1 - offset, 1)
    periods.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }
  return periods
}

export const financeService = {
  summary(): Promise<FinanceSummary> {
    const closedOperations = db.operations.filter((operation) => operation.status === 'closed')

    const saleCommissions = closedOperations
      .filter((operation) => operation.type === 'sale')
      .reduce((total, operation) => total + toArs(operation.commission), 0)

    const rentCommissions = closedOperations
      .filter((operation) => operation.type === 'rent')
      .reduce((total, operation) => total + toArs(operation.commission), 0)

    const managementFees = db.settlements.reduce(
      (total, settlement) =>
        total +
        settlement.lines
          .filter((line) => line.kind === 'debit' && line.concept.startsWith('Comisión'))
          .reduce((sum, line) => sum + toArs(line.amount), 0),
      0,
    )

    const operationExpenses = closedOperations.reduce(
      (total, operation) => total + (operation.expenses ? toArs(operation.expenses) : 0),
      0,
    )

    const ownerExpenses = db.settlements.reduce(
      (total, settlement) =>
        total +
        settlement.lines
          .filter((line) => line.kind === 'debit' && !line.concept.startsWith('Comisión'))
          .reduce((sum, line) => sum + toArs(line.amount), 0),
      0,
    )

    const rentCollected = db.payments
      .filter((payment) => payment.status === 'paid' || payment.status === 'partial')
      .reduce((total, payment) => total + toArs(payment.paidAmount ?? payment.amount), 0)

    const rentPending = db.payments
      .filter((payment) => payment.status !== 'paid')
      .reduce((total, payment) => {
        const due = payment.amount.amount - (payment.paidAmount?.amount ?? 0)
        return total + due
      }, 0)

    const toSettle = db.settlements
      .filter((settlement) => settlement.status === 'pending')
      .reduce((total, settlement) => total + toArs(settlement.total), 0)

    return respond({
      income: ars(saleCommissions + rentCommissions + managementFees),
      expenses: ars(operationExpenses + ownerExpenses),
      saleCommissions: ars(saleCommissions),
      rentCommissions: ars(rentCommissions),
      rentCollected: ars(rentCollected),
      rentPending: ars(rentPending),
      toSettle: ars(toSettle),
      overdueCount: db.payments.filter((payment) => payment.status === 'overdue').length,
    })
  },

  /** Income vs expenses for the last six months. */
  monthlyFlow(months = 6): Promise<MonthlyFlow[]> {
    const periods = lastPeriods(months)

    return respond(
      periods.map((period) => {
        const rentIncome = db.settlements
          .filter((settlement) => settlement.period === period)
          .reduce(
            (total, settlement) =>
              total +
              settlement.lines
                .filter((line) => line.kind === 'debit' && line.concept.startsWith('Comisión'))
                .reduce((sum, line) => sum + toArs(line.amount), 0),
            0,
          )

        const saleIncome = db.operations
          .filter(
            (operation) => operation.status === 'closed' && operation.closedAt?.startsWith(period),
          )
          .reduce((total, operation) => total + toArs(operation.commission), 0)

        const expenses =
          db.operations
            .filter(
              (operation) => operation.status === 'closed' && operation.closedAt?.startsWith(period),
            )
            .reduce((total, operation) => total + (operation.expenses ? toArs(operation.expenses) : 0), 0) +
          db.settlements
            .filter((settlement) => settlement.period === period)
            .reduce(
              (total, settlement) =>
                total +
                settlement.lines
                  .filter((line) => line.kind === 'debit' && !line.concept.startsWith('Comisión'))
                  .reduce((sum, line) => sum + toArs(line.amount), 0),
              0,
            )

        return {
          period,
          label: formatPeriod(period),
          income: Math.round(rentIncome + saleIncome),
          expenses: Math.round(expenses),
        }
      }),
    )
  },

  commissionsByAgent(): Promise<CommissionRow[]> {
    const rows = new Map<Id, CommissionRow>()
    for (const operation of db.operations) {
      if (operation.status !== 'closed') continue
      const current = rows.get(operation.agentId) ?? {
        agentId: operation.agentId,
        agentName: db.users.find((user) => user.id === operation.agentId)?.name ?? 'Sin asignar',
        operations: 0,
        commission: 0,
      }
      current.operations += 1
      current.commission += toArs(operation.commission)
      rows.set(operation.agentId, current)
    }
    return respond([...rows.values()].sort((a, b) => b.commission - a.commission))
  },

  pendingSettlements(): Promise<PendingSettlementRow[]> {
    const rows = db.settlements
      .filter((settlement) => settlement.status === 'pending')
      .map((settlement) => {
        const rental = db.rentals.find((item) => item.id === settlement.rentalId)
        return {
          id: settlement.id,
          code: settlement.code,
          ownerName: personName(settlement.ownerId),
          propertyLabel: rental ? propertyLabel(rental.propertyId) : 'Sin propiedad',
          period: settlement.period,
          total: settlement.total,
        }
      })
    return respond(rows)
  },
}
