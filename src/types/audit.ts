import type { EntityKind, Id, IsoDate } from './common'

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'price_change'
  | 'status_change'
  | 'permission_change'
  | 'document_upload'
  | 'payment_register'
  | 'login'

export interface AuditChange {
  field: string
  before: string
  after: string
}

export interface AuditEvent {
  id: Id
  at: IsoDate
  userId: Id
  action: AuditAction
  entityKind: EntityKind
  entityId: Id
  entityLabel: string
  summary: string
  /** Present on update-like actions; rendered as "before -> after". */
  changes?: AuditChange[]
}

export interface AuditFilters {
  search?: string
  userId?: Id | 'all'
  action?: AuditAction | 'all'
  entityKind?: EntityKind | 'all'
  from?: IsoDate
  to?: IsoDate
}
