import { db } from '@/mocks/db'
import type {
  Id,
  Money,
  Operation,
  OperationFilters,
  OperationStatus,
  Page,
  PageRequest,
  Property,
  Rental,
  StoredDocument,
  User,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'
import { findProperty, findRental, findUser, personName, propertyLabel } from './support/refs'

export interface OperationListItem {
  id: Id
  code: string
  type: Operation['type']
  status: OperationStatus
  propertyId: Id
  propertyTitle: string
  propertyCode: string
  /** Buyer on sales, tenant on rentals. */
  counterpartName: string
  /** Seller on sales, owner on rentals. */
  principalName: string
  price: Money
  commission: Money
  agentId: Id
  agentName: string
  startedAt: string
  closedAt?: string
}

export interface OperationDetail {
  operation: Operation
  property: Property | undefined
  agent: User | undefined
  parties: { personId: Id; role: Operation['parties'][number]['role']; name: string }[]
  documents: StoredDocument[]
  rental: Rental | undefined
  /** Net result for the agency: commission minus operation expenses. */
  net: Money
}

function counterpart(operation: Operation): string {
  const party = operation.parties.find((item) => item.role === 'buyer' || item.role === 'tenant')
  return party ? personName(party.personId) : 'Sin definir'
}

function principal(operation: Operation): string {
  const party = operation.parties.find((item) => item.role === 'seller' || item.role === 'owner')
  return party ? personName(party.personId) : 'Sin definir'
}

function toListItem(operation: Operation): OperationListItem {
  const property = findProperty(operation.propertyId)
  return {
    id: operation.id,
    code: operation.code,
    type: operation.type,
    status: operation.status,
    propertyId: operation.propertyId,
    propertyTitle: property?.title ?? 'Propiedad',
    propertyCode: property?.code ?? operation.propertyId,
    counterpartName: counterpart(operation),
    principalName: principal(operation),
    price: operation.price,
    commission: operation.commission,
    agentId: operation.agentId,
    agentName: findUser(operation.agentId)?.name ?? 'Sin asignar',
    startedAt: operation.startedAt,
    closedAt: operation.closedAt,
  }
}

export const operationsService = {
  list(
    filters: OperationFilters = {},
    request: PageRequest = {},
  ): Promise<Page<OperationListItem>> {
    const filtered = db.operations.filter((operation) => {
      if (filters.search) {
        const haystack = [
          operation.code,
          propertyLabel(operation.propertyId),
          counterpart(operation),
          principal(operation),
        ].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.type && filters.type !== 'all' && operation.type !== filters.type) return false
      if (filters.status && filters.status !== 'all' && operation.status !== filters.status) {
        return false
      }
      if (filters.agentId && filters.agentId !== 'all' && operation.agentId !== filters.agentId) {
        return false
      }
      return true
    })

    const sorted = sortBy(filtered, (operation) => operation.startedAt, request.sortDir ?? 'desc')
    const page = paginate(sorted, { pageSize: 10, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  getById(id: Id): Promise<OperationDetail> {
    const operation = db.operations.find((item) => item.id === id)
    if (!operation) return Promise.reject(notFound('la operación', id))

    const documents = db.documents.filter(
      (document) => document.entityKind === 'operation' && document.entityId === id,
    )

    return respond({
      operation,
      property: findProperty(operation.propertyId),
      agent: findUser(operation.agentId),
      parties: operation.parties.map((party) => ({
        ...party,
        name: personName(party.personId),
      })),
      documents,
      rental: findRental(operation.rentalId),
      net: {
        amount: operation.commission.amount - (operation.expenses?.amount ?? 0),
        currency: operation.commission.currency,
      },
    })
  },

  changeStatus(id: Id, status: OperationStatus, actingUserId: Id): Promise<Operation> {
    const operation = db.operations.find((item) => item.id === id)
    if (!operation) return Promise.reject(notFound('la operación', id))
    const before = operation.status
    if (before === status) return respond(operation)

    operation.status = status
    if (status === 'closed' && !operation.closedAt) {
      operation.closedAt = new Date().toISOString().slice(0, 10)
    }

    recordAudit({
      userId: actingUserId,
      action: 'status_change',
      entityKind: 'operation',
      entityId: operation.id,
      entityLabel: `${operation.code} — ${propertyLabel(operation.propertyId)}`,
      summary: `Cambió el estado de la operación ${operation.code}`,
      changes: [{ field: 'Estado', before, after: status }],
    })
    return respond(operation)
  },
}
