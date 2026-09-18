import type { Id, IsoDate, Money } from './common'

export type OperationType = 'sale' | 'rent'

export type OperationStatus =
  | 'started'
  | 'reserved'
  | 'negotiation'
  | 'documentation'
  | 'signature'
  | 'closed'
  | 'cancelled'

export type OperationPartyRole = 'buyer' | 'seller' | 'owner' | 'tenant' | 'guarantor'

export interface OperationParty {
  personId: Id
  role: OperationPartyRole
}

export interface Operation {
  id: Id
  code: string
  type: OperationType
  status: OperationStatus
  propertyId: Id
  agentId: Id
  parties: OperationParty[]
  price: Money
  /** Reservation amount on sales, security deposit on rentals. */
  reservation?: Money
  downPayment?: Money
  commission: Money
  commissionRate: number
  expenses?: Money
  startedAt: IsoDate
  closedAt?: IsoDate
  /** Rent operations produce a rental contract once signed. */
  rentalId?: Id
  notes?: string
}

export interface OperationFilters {
  search?: string
  type?: OperationType | 'all'
  status?: OperationStatus | 'all'
  agentId?: Id | 'all'
}
