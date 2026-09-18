import { db } from '@/mocks/db'
import { fullName } from '@/lib/format'
import type {
  ActivityEntry,
  Id,
  Lead,
  Operation,
  Page,
  PageRequest,
  Person,
  PersonFilters,
  PersonRole,
  Property,
  StoredDocument,
  Visit,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { findPerson, findProperty, propertyLabel } from './support/refs'

export interface ClientListItem {
  id: Id
  name: string
  document: string
  phone: string
  email: string
  roles: PersonRole[]
  propertiesCount: number
  operationsCount: number
  lastActivityAt?: string
}

export interface ClientDetail {
  person: Person
  properties: Property[]
  operations: Operation[]
  leads: Lead[]
  visits: Visit[]
  documents: StoredDocument[]
  activity: ActivityEntry[]
  /** Contracts where the person is owner or tenant. */
  rentals: { id: Id; code: string; role: 'owner' | 'tenant' | 'guarantor'; propertyLabel: string }[]
}

function ownedProperties(personId: Id): Property[] {
  return db.properties.filter((property) => property.ownerId === personId)
}

function personOperations(personId: Id): Operation[] {
  return db.operations.filter((operation) =>
    operation.parties.some((party) => party.personId === personId),
  )
}

function toListItem(person: Person): ClientListItem {
  return {
    id: person.id,
    name: fullName(person),
    document: `${person.documentType} ${person.documentNumber}`,
    phone: person.phone,
    email: person.email,
    roles: person.roles,
    propertiesCount: ownedProperties(person.id).length,
    operationsCount: personOperations(person.id).length,
    lastActivityAt: person.lastActivityAt,
  }
}

export const clientsService = {
  list(filters: PersonFilters = {}, request: PageRequest = {}): Promise<Page<ClientListItem>> {
    const filtered = db.people.filter((person) => {
      if (filters.search) {
        const haystack = [
          person.firstName,
          person.lastName,
          person.documentNumber,
          person.email,
          person.phone,
        ].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.role && filters.role !== 'all' && !person.roles.includes(filters.role)) {
        return false
      }
      return true
    })

    const sorted = sortBy(
      filtered,
      (person) => {
        switch (request.sortBy) {
          case 'lastActivityAt':
            return person.lastActivityAt ?? ''
          case 'propertiesCount':
            return ownedProperties(person.id).length
          default:
            return fullName(person)
        }
      },
      request.sortDir ?? (request.sortBy ? 'desc' : 'asc'),
    )

    const page = paginate(sorted, request)
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  getById(id: Id): Promise<ClientDetail> {
    const person = findPerson(id)
    if (!person) return Promise.reject(notFound('el cliente', id))

    const properties = ownedProperties(id)
    const operations = personOperations(id)
    const leads = db.leads.filter((lead) => lead.personId === id)
    const visits = db.visits.filter((visit) => visit.personId === id)
    const documents = db.documents.filter(
      (document) => document.entityKind === 'client' && document.entityId === id,
    )

    const rentals: ClientDetail['rentals'] = db.rentals
      .filter(
        (rental) =>
          rental.ownerId === id || rental.tenantId === id || rental.guarantorIds.includes(id),
      )
      .map((rental) => ({
        id: rental.id,
        code: rental.code,
        role: rental.ownerId === id ? 'owner' : rental.tenantId === id ? 'tenant' : 'guarantor',
        propertyLabel: propertyLabel(rental.propertyId),
      }))

    return respond({
      person,
      properties,
      operations,
      leads,
      visits,
      documents,
      rentals,
      activity: buildClientActivity(person, { leads, visits, operations }),
    })
  },

  /** Option list for owner/party pickers. */
  options(role?: PersonRole): Promise<{ id: Id; label: string }[]> {
    const source = role ? db.people.filter((person) => person.roles.includes(role)) : db.people
    return respond(
      source
        .map((person) => ({ id: person.id, label: `${fullName(person)} (${person.id})` }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es-AR')),
    )
  },
}

function buildClientActivity(
  person: Person,
  related: { leads: Lead[]; visits: Visit[]; operations: Operation[] },
): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    {
      id: `${person.id}-created`,
      at: person.createdAt,
      title: 'Cliente registrado',
      description: `Ingresó como ${person.roles.length > 1 ? 'múltiples roles' : person.roles[0]}`,
      icon: 'client',
    },
  ]

  for (const lead of related.leads) {
    entries.push({
      id: `activity-${lead.id}`,
      at: lead.createdAt,
      userId: lead.agentId,
      title: `Lead ${lead.code} creado`,
      description: lead.propertyId ? propertyLabel(lead.propertyId) : 'Consulta general',
      icon: 'lead',
      entityKind: 'lead',
      entityId: lead.id,
    })
  }

  for (const visit of related.visits) {
    entries.push({
      id: `activity-${visit.id}`,
      at: `${visit.date}T${visit.time}:00`,
      userId: visit.agentId,
      title: `Visita a ${findProperty(visit.propertyId)?.title ?? 'propiedad'}`,
      description: visit.comments,
      icon: 'visit',
      entityKind: 'visit',
      entityId: visit.id,
    })
  }

  for (const operation of related.operations) {
    entries.push({
      id: `activity-${operation.id}`,
      at: operation.startedAt,
      userId: operation.agentId,
      title: `Operación ${operation.code}`,
      description: propertyLabel(operation.propertyId),
      icon: 'operation',
      entityKind: 'operation',
      entityId: operation.id,
    })
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1))
}
