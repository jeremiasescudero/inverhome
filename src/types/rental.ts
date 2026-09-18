import type { Id, IsoDate, Money } from './common'

export type RentalStatus = 'active' | 'expiring' | 'expired' | 'finished'

export interface Rental {
  id: Id
  code: string
  propertyId: Id
  ownerId: Id
  tenantId: Id
  guarantorIds: Id[]
  agentId: Id
  operationId?: Id
  monthlyAmount: Money
  deposit: Money
  /** Agency fee withheld from every collected month, as a percentage. */
  managementFeeRate: number
  startDate: IsoDate
  endDate: IsoDate
  nextAdjustmentDate: IsoDate
  adjustmentPeriodMonths: number
  status: RentalStatus
}

export interface RentalFilters {
  search?: string
  status?: RentalStatus | 'all'
}
