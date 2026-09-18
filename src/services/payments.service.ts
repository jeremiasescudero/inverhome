import { db } from '@/mocks/db'
import type {
  Id,
  Money,
  Page,
  PageRequest,
  Payment,
  PaymentFilters,
  PaymentMethod,
  PaymentStatus,
  Settlement,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'
import { findRental, personName, propertyLabel } from './support/refs'

export interface PaymentListItem {
  id: Id
  code: string
  rentalId: Id
  rentalCode: string
  propertyLabel: string
  tenantName: string
  period: string
  amount: Money
  paidAmount?: Money
  dueDate: string
  paidAt?: string
  status: PaymentStatus
  method?: PaymentMethod
  settlementId?: Id
}

export interface SettlementDetail {
  settlement: Settlement
  ownerName: string
  propertyLabel: string
  rentalCode: string
}

function toListItem(payment: Payment): PaymentListItem {
  const rental = findRental(payment.rentalId)
  return {
    id: payment.id,
    code: payment.code,
    rentalId: payment.rentalId,
    rentalCode: rental?.code ?? payment.rentalId,
    propertyLabel: rental ? propertyLabel(rental.propertyId) : 'Sin propiedad',
    tenantName: rental ? personName(rental.tenantId) : 'Sin inquilino',
    period: payment.period,
    amount: payment.amount,
    paidAmount: payment.paidAmount,
    dueDate: payment.dueDate,
    paidAt: payment.paidAt,
    status: payment.status,
    method: payment.method,
    settlementId: payment.settlementId,
  }
}

export const paymentsService = {
  list(filters: PaymentFilters = {}, request: PageRequest = {}): Promise<Page<PaymentListItem>> {
    const filtered = db.payments.filter((payment) => {
      if (filters.search) {
        const rental = findRental(payment.rentalId)
        const haystack = [
          payment.code,
          payment.period,
          rental?.code ?? '',
          rental ? personName(rental.tenantId) : '',
          rental ? propertyLabel(rental.propertyId) : '',
        ].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.status && filters.status !== 'all' && payment.status !== filters.status) {
        return false
      }
      if (filters.rentalId && filters.rentalId !== 'all' && payment.rentalId !== filters.rentalId) {
        return false
      }
      if (filters.period && filters.period !== 'all' && payment.period !== filters.period) {
        return false
      }
      return true
    })

    const sorted = sortBy(filtered, (payment) => payment.dueDate, request.sortDir ?? 'desc')
    const page = paginate(sorted, { pageSize: 15, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  /** Distinct periods present in the dataset, newest first. */
  periods(): Promise<string[]> {
    const unique = [...new Set(db.payments.map((payment) => payment.period))]
    return respond(unique.sort((a, b) => b.localeCompare(a)))
  },

  registerPayment(
    id: Id,
    input: { method: PaymentMethod; paidAt: string },
    actingUserId: Id,
  ): Promise<Payment> {
    const payment = db.payments.find((item) => item.id === id)
    if (!payment) return Promise.reject(notFound('el pago', id))
    const before = payment.status

    payment.status = 'paid'
    payment.paidAmount = payment.amount
    payment.method = input.method
    payment.paidAt = input.paidAt

    recordAudit({
      userId: actingUserId,
      action: 'payment_register',
      entityKind: 'payment',
      entityId: payment.id,
      entityLabel: `${payment.code} — ${payment.period}`,
      summary: `Registró el pago ${payment.code}`,
      changes: [{ field: 'Estado', before, after: 'paid' }],
    })
    return respond(payment)
  },

  settlements(): Promise<SettlementDetail[]> {
    const items = db.settlements
      .slice()
      .sort((a, b) => b.period.localeCompare(a.period))
      .map((settlement) => {
        const rental = findRental(settlement.rentalId)
        return {
          settlement,
          ownerName: personName(settlement.ownerId),
          propertyLabel: rental ? propertyLabel(rental.propertyId) : 'Sin propiedad',
          rentalCode: rental?.code ?? settlement.rentalId,
        }
      })
    return respond(items)
  },

  getSettlement(id: Id): Promise<SettlementDetail> {
    const settlement = db.settlements.find((item) => item.id === id)
    if (!settlement) return Promise.reject(notFound('la liquidación', id))
    const rental = findRental(settlement.rentalId)
    return respond({
      settlement,
      ownerName: personName(settlement.ownerId),
      propertyLabel: rental ? propertyLabel(rental.propertyId) : 'Sin propiedad',
      rentalCode: rental?.code ?? settlement.rentalId,
    })
  },
}
