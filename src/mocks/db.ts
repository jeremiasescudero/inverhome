import { auditEvents } from './data/audit'
import { documents } from './data/documents'
import { leads } from './data/leads'
import { operations } from './data/operations'
import { payments, settlements } from './data/payments'
import { people } from './data/people'
import { properties } from './data/properties'
import { rentals } from './data/rentals'
import { users } from './data/users'
import { visits } from './data/visits'
import type {
  AuditEvent,
  Lead,
  Operation,
  Payment,
  Person,
  Property,
  Rental,
  Settlement,
  StoredDocument,
  User,
  Visit,
} from '@/types'

/**
 * In-memory database for the demo.
 *
 * Services are the only layer allowed to touch it, exactly as they would be
 * the only layer talking to a real API. Mutations made through the UI live
 * here for the session and are lost on reload, which is the documented scope
 * of this stage (spec section 1).
 */
export interface MockDb {
  users: User[]
  people: Person[]
  properties: Property[]
  leads: Lead[]
  visits: Visit[]
  operations: Operation[]
  rentals: Rental[]
  payments: Payment[]
  settlements: Settlement[]
  documents: StoredDocument[]
  auditEvents: AuditEvent[]
}

function seed(): MockDb {
  // Structured clone keeps the seed modules immutable between resets.
  return structuredClone({
    users,
    people,
    properties,
    leads,
    visits,
    operations,
    rentals,
    payments,
    settlements,
    documents,
    auditEvents,
  })
}

export const db: MockDb = seed()

/** Restores the pristine dataset. Used by tests and by the demo reset action. */
export function resetDb(): void {
  const fresh = seed()
  for (const key of Object.keys(fresh) as (keyof MockDb)[]) {
    // Replace contents in place so modules holding a reference stay valid.
    ;(db[key] as unknown[]).length = 0
    ;(db[key] as unknown[]).push(...(fresh[key] as unknown[]))
  }
}

/**
 * Next sequential code for an entity family, e.g. nextCode('PROP', db.properties)
 * returns PROP-0021 when twenty properties exist.
 */
export function nextCode(prefix: string, collection: { id: string }[]): string {
  const highest = collection.reduce((max, item) => {
    const match = /(\d+)$/.exec(item.id)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`
}

/** Reference "today" for the demo dataset, so seeded states stay coherent. */
export const DEMO_TODAY = '2026-09-16'
