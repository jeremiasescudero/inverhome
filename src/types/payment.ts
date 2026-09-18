import type { Id, IsoDate, Money } from './common'

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'

export type PaymentMethod = 'transfer' | 'cash' | 'check' | 'card' | 'debit'

export interface Payment {
  id: Id
  code: string
  rentalId: Id
  /** Accrual period in YYYY-MM form. */
  period: string
  amount: Money
  paidAmount?: Money
  dueDate: IsoDate
  paidAt?: IsoDate
  status: PaymentStatus
  method?: PaymentMethod
  receiptId?: Id
  settlementId?: Id
}

export interface PaymentFilters {
  search?: string
  status?: PaymentStatus | 'all'
  rentalId?: Id | 'all'
  period?: string | 'all'
}

export interface SettlementLine {
  concept: string
  amount: Money
  kind: 'credit' | 'debit'
}

export interface Settlement {
  id: Id
  code: string
  rentalId: Id
  ownerId: Id
  period: string
  lines: SettlementLine[]
  total: Money
  status: 'pending' | 'paid'
  createdAt: IsoDate
  paidAt?: IsoDate
}
