import { db } from '@/mocks/db'
import type { AuditAction, AuditChange, EntityKind, Id } from '@/types'

/**
 * Appends an audit event for an action performed through the UI.
 *
 * In the real system this would happen server-side: the client cannot be
 * trusted to report its own actions (spec section 21). Here it exists so the
 * audit module reflects what the demo user actually did.
 */
export function recordAudit(input: {
  userId: Id
  action: AuditAction
  entityKind: EntityKind
  entityId: Id
  entityLabel: string
  summary: string
  changes?: AuditChange[]
}): void {
  const nextNumber = db.auditEvents.length + 1
  db.auditEvents.unshift({
    id: `AUD-${String(nextNumber).padStart(4, '0')}-L`,
    at: new Date().toISOString().slice(0, 19),
    ...input,
  })
}
