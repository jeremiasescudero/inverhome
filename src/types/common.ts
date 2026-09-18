/** Identifier of any domain entity. Mock ids are human readable (PROP-0001). */
export type Id = string

export type Currency = 'ARS' | 'USD'

export interface Money {
  amount: number
  currency: Currency
}

/** ISO-8601 date string: 2026-09-16 or 2026-09-16T10:32:00. */
export type IsoDate = string

/**
 * Visual/semantic tone shared by every status in the system. Keeping the set
 * small is what makes badges consistent across modules (spec section 25).
 */
export type StatusTone = 'positive' | 'attention' | 'info' | 'critical' | 'neutral'

export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface PageRequest {
  page?: number
  pageSize?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export type EntityKind =
  | 'property'
  | 'client'
  | 'lead'
  | 'visit'
  | 'operation'
  | 'rental'
  | 'payment'
  | 'document'
  | 'user'
  | 'settlement'

/** Entity reference used when a module only needs a label and a link target. */
export interface EntityRef {
  id: Id
  label: string
  kind: EntityKind
}
