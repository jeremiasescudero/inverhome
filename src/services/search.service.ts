import { db } from '@/mocks/db'
import { fullName } from '@/lib/format'
import type { EntityKind, Id } from '@/types'
import { matches, respond } from './api'
import { formatAddress, personName, propertyLabel } from './support/refs'

export interface SearchHit {
  id: Id
  kind: EntityKind
  title: string
  subtitle: string
  href: string
}

export interface SearchGroup {
  kind: EntityKind
  hits: SearchHit[]
}

const MAX_PER_GROUP = 4

/**
 * Global search across the four entities a user looks for from the header
 * (spec section 26). Results are grouped by kind, capped per group.
 */
export const searchService = {
  query(term: string): Promise<SearchGroup[]> {
    const trimmed = term.trim()
    if (trimmed.length < 2) return respond([])

    const properties: SearchHit[] = db.properties
      .filter((property) =>
        matches(
          [property.code, property.title, property.location.neighborhood].join(' '),
          trimmed,
        ),
      )
      .slice(0, MAX_PER_GROUP)
      .map((property) => ({
        id: property.id,
        kind: 'property' as const,
        title: `${property.code} — ${property.title}`,
        subtitle: formatAddress(property.location),
        href: `/propiedades/${property.id}`,
      }))

    const clients: SearchHit[] = db.people
      .filter((person) =>
        matches([fullName(person), person.documentNumber, person.email].join(' '), trimmed),
      )
      .slice(0, MAX_PER_GROUP)
      .map((person) => ({
        id: person.id,
        kind: 'client' as const,
        title: fullName(person),
        subtitle: `${person.documentType} ${person.documentNumber}`,
        href: `/clientes/${person.id}`,
      }))

    const leads: SearchHit[] = db.leads
      .filter((lead) =>
        matches([lead.code, personName(lead.personId), lead.notes].join(' '), trimmed),
      )
      .slice(0, MAX_PER_GROUP)
      .map((lead) => ({
        id: lead.id,
        kind: 'lead' as const,
        title: `${lead.code} — ${personName(lead.personId)}`,
        subtitle: lead.propertyId ? propertyLabel(lead.propertyId) : 'Consulta general',
        href: `/leads/${lead.id}`,
      }))

    const operations: SearchHit[] = db.operations
      .filter((operation) =>
        matches([operation.code, propertyLabel(operation.propertyId)].join(' '), trimmed),
      )
      .slice(0, MAX_PER_GROUP)
      .map((operation) => ({
        id: operation.id,
        kind: 'operation' as const,
        title: `${operation.code} — ${operation.type === 'sale' ? 'Venta' : 'Alquiler'}`,
        subtitle: propertyLabel(operation.propertyId),
        href: `/operaciones/${operation.id}`,
      }))

    const groups = (
      [
        { kind: 'property', hits: properties },
        { kind: 'client', hits: clients },
        { kind: 'lead', hits: leads },
        { kind: 'operation', hits: operations },
      ] satisfies SearchGroup[]
    ).filter((group) => group.hits.length > 0)

    return respond(groups)
  },
}
