import { db, DEMO_TODAY } from '@/mocks/db'
import { daysFromToday } from '@/lib/format'
import type {
  Id,
  Money,
  Page,
  PageRequest,
  Payment,
  Property,
  Rental,
  RentalFilters,
  RentalStatus,
  Settlement,
  StoredDocument,
  User,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { findProperty, findUser, personName, propertyLabel } from './support/refs'

export interface RentalListItem {
  id: Id
  code: string
  propertyId: Id
  propertyTitle: string
  ownerId: Id
  ownerName: string
  tenantId: Id
  tenantName: string
  monthlyAmount: Money
  nextAdjustmentDate: string
  endDate: string
  daysToExpiry: number
  status: RentalStatus
  pendingPayments: number
  overduePayments: number
}

export interface RentalDetail {
  rental: Rental
  property: Property | undefined
  ownerName: string
  tenantName: string
  guarantorNames: string[]
  agent: User | undefined
  payments: Payment[]
  settlements: Settlement[]
  documents: StoredDocument[]
  /** Monthly fee the agency withholds, derived from the contract rate. */
  managementFee: Money
}

function paymentsOf(rentalId: Id): Payment[] {
  return db.payments
    .filter((payment) => payment.rentalId === rentalId)
    .sort((a, b) => b.period.localeCompare(a.period))
}

function toListItem(rental: Rental, today: string): RentalListItem {
  const related = paymentsOf(rental.id)
  return {
    id: rental.id,
    code: rental.code,
    propertyId: rental.propertyId,
    propertyTitle: findProperty(rental.propertyId)?.title ?? 'Propiedad',
    ownerId: rental.ownerId,
    ownerName: personName(rental.ownerId),
    tenantId: rental.tenantId,
    tenantName: personName(rental.tenantId),
    monthlyAmount: rental.monthlyAmount,
    nextAdjustmentDate: rental.nextAdjustmentDate,
    endDate: rental.endDate,
    daysToExpiry: daysFromToday(rental.endDate, new Date(today)),
    status: rental.status,
    pendingPayments: related.filter((payment) => payment.status === 'pending').length,
    overduePayments: related.filter(
      (payment) => payment.status === 'overdue' || payment.status === 'partial',
    ).length,
  }
}

export const rentalsService = {
  list(filters: RentalFilters = {}, request: PageRequest = {}): Promise<Page<RentalListItem>> {
    const filtered = db.rentals.filter((rental) => {
      if (filters.search) {
        const haystack = [
          rental.code,
          propertyLabel(rental.propertyId),
          personName(rental.ownerId),
          personName(rental.tenantId),
        ].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.status && filters.status !== 'all' && rental.status !== filters.status) {
        return false
      }
      return true
    })

    const sorted = sortBy(filtered, (rental) => rental.endDate, request.sortDir ?? 'asc')
    const page = paginate(sorted, { pageSize: 10, ...request })
    return respond({
      ...page,
      items: page.items.map((rental) => toListItem(rental, DEMO_TODAY)),
    })
  },

  getById(id: Id): Promise<RentalDetail> {
    const rental = db.rentals.find((item) => item.id === id)
    if (!rental) return Promise.reject(notFound('el alquiler', id))

    const documents = db.documents.filter(
      (document) => document.entityKind === 'rental' && document.entityId === id,
    )

    return respond({
      rental,
      property: findProperty(rental.propertyId),
      ownerName: personName(rental.ownerId),
      tenantName: personName(rental.tenantId),
      guarantorNames: rental.guarantorIds.map((guarantorId) => personName(guarantorId)),
      agent: findUser(rental.agentId),
      payments: paymentsOf(rental.id),
      settlements: db.settlements
        .filter((settlement) => settlement.rentalId === rental.id)
        .sort((a, b) => b.period.localeCompare(a.period)),
      documents,
      managementFee: {
        amount: Math.round((rental.monthlyAmount.amount * rental.managementFeeRate) / 100),
        currency: rental.monthlyAmount.currency,
      },
    })
  },

  /** Contracts expiring within `days`, used by dashboard alerts. */
  expiringSoon(days = 60, today: string = DEMO_TODAY): Promise<RentalListItem[]> {
    const items = db.rentals
      .filter((rental) => {
        const remaining = daysFromToday(rental.endDate, new Date(today))
        return rental.status !== 'finished' && remaining <= days
      })
      .sort((a, b) => a.endDate.localeCompare(b.endDate))
      .map((rental) => toListItem(rental, today))
    return respond(items)
  },
}
