import { db, nextCode } from '@/mocks/db'
import { formatMoney } from '@/lib/format'
import type {
  ActivityEntry,
  AuditChange,
  Id,
  Money,
  Operation,
  Page,
  PageRequest,
  Person,
  Property,
  PropertyDraft,
  PropertyFilters,
  StoredDocument,
  User,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'
import { findPerson, findProperty, findUser, formatAddress, propertyShortLabel } from './support/refs'

/** Row shape consumed by the properties table and card grid. */
export interface PropertyListItem {
  id: Id
  code: string
  title: string
  address: string
  neighborhood: string
  operation: Property['operation']
  type: Property['type']
  status: Property['status']
  price: Money
  rentPrice?: Money
  agentId: Id
  agentName: string
  ownerName: string
  rooms: number
  bedrooms: number
  totalArea: number
  coverImage: string
  published: boolean
  updatedAt: string
}

export interface PropertyDetail {
  property: Property
  address: string
  owner: Person | undefined
  agent: User | undefined
  documents: StoredDocument[]
  operations: Operation[]
  activity: ActivityEntry[]
}

function toListItem(property: Property): PropertyListItem {
  return {
    id: property.id,
    code: property.code,
    title: property.title,
    address: formatAddress(property.location),
    neighborhood: property.location.neighborhood,
    operation: property.operation,
    type: property.type,
    status: property.status,
    price: property.price,
    rentPrice: property.rentPrice,
    agentId: property.agentId,
    agentName: findUser(property.agentId)?.name ?? 'Sin asignar',
    ownerName: (() => {
      const owner = findPerson(property.ownerId)
      return owner ? `${owner.firstName} ${owner.lastName}` : 'Sin propietario'
    })(),
    rooms: property.features.rooms,
    bedrooms: property.features.bedrooms,
    totalArea: property.features.totalArea,
    coverImage: property.images[0] ?? 'Sin fotos',
    published: property.published,
    updatedAt: property.updatedAt,
  }
}

function applyFilters(items: Property[], filters: PropertyFilters): Property[] {
  return items.filter((property) => {
    if (filters.search) {
      const haystack = [
        property.code,
        property.title,
        property.location.neighborhood,
        property.location.street,
        property.description,
      ].join(' ')
      if (!matches(haystack, filters.search)) return false
    }
    if (filters.operation && filters.operation !== 'all') {
      // A property listed for both operations must appear under either filter.
      const isBoth = property.operation === 'sale_rent'
      if (!isBoth && property.operation !== filters.operation) return false
    }
    if (filters.type && filters.type !== 'all' && property.type !== filters.type) return false
    if (filters.status && filters.status !== 'all' && property.status !== filters.status) {
      return false
    }
    if (filters.agentId && filters.agentId !== 'all' && property.agentId !== filters.agentId) {
      return false
    }
    if (
      filters.neighborhood &&
      filters.neighborhood !== 'all' &&
      property.location.neighborhood !== filters.neighborhood
    ) {
      return false
    }
    if (filters.minPrice !== undefined && property.price.amount < filters.minPrice) return false
    if (filters.maxPrice !== undefined && property.price.amount > filters.maxPrice) return false
    if (filters.minRooms !== undefined && property.features.rooms < filters.minRooms) return false
    if (filters.publishedOnly && !property.published) return false
    return true
  })
}

const SORTERS: Record<string, (property: Property) => string | number> = {
  code: (property) => property.code,
  title: (property) => property.title,
  price: (property) => property.price.amount,
  status: (property) => property.status,
  agentName: (property) => findUser(property.agentId)?.name ?? '',
  updatedAt: (property) => property.updatedAt,
}

export const propertiesService = {
  list(
    filters: PropertyFilters = {},
    request: PageRequest = {},
  ): Promise<Page<PropertyListItem>> {
    const filtered = applyFilters(db.properties, filters)
    const sorter = SORTERS[request.sortBy ?? 'updatedAt'] ?? SORTERS.updatedAt
    const sorted = sortBy(filtered, sorter, request.sortDir ?? 'desc')
    const page = paginate(sorted, request)
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  getById(id: Id): Promise<PropertyDetail> {
    const property = findProperty(id)
    if (!property) return Promise.reject(notFound('la propiedad', id))

    const documents = db.documents.filter(
      (document) => document.entityKind === 'property' && document.entityId === id,
    )
    const operations = db.operations.filter((operation) => operation.propertyId === id)
    const activity = buildPropertyActivity(property)

    return respond({
      property,
      address: formatAddress(property.location),
      owner: findPerson(property.ownerId),
      agent: findUser(property.agentId),
      documents,
      operations,
      activity,
    })
  },

  /** Distinct neighbourhoods, for the location filter. */
  neighborhoods(): Promise<string[]> {
    const unique = [...new Set(db.properties.map((p) => p.location.neighborhood))]
    return respond(unique.sort((a, b) => a.localeCompare(b, 'es-AR')))
  },

  create(draft: PropertyDraft, actingUserId: Id): Promise<Property> {
    const code = nextCode('PROP', db.properties)
    const today = new Date().toISOString().slice(0, 10)
    const property: Property = {
      id: code,
      code,
      title: draft.title,
      description: draft.description,
      operation: draft.operation,
      type: draft.type,
      status: draft.status,
      price: { amount: draft.priceAmount, currency: draft.priceCurrency },
      location: draft.location,
      features: draft.features,
      ownerId: draft.ownerId,
      agentId: draft.agentId,
      images: [],
      published: draft.published,
      createdAt: today,
      updatedAt: today,
    }
    db.properties.unshift(property)
    recordAudit({
      userId: actingUserId,
      action: 'create',
      entityKind: 'property',
      entityId: property.id,
      entityLabel: propertyShortLabel(property),
      summary: `Creó la propiedad ${property.code}`,
    })
    return respond(property)
  },

  update(id: Id, draft: PropertyDraft, actingUserId: Id): Promise<Property> {
    const current = findProperty(id)
    if (!current) return Promise.reject(notFound('la propiedad', id))

    const changes: AuditChange[] = []
    if (current.price.amount !== draft.priceAmount) {
      changes.push({
        field: 'Precio',
        before: formatMoney(current.price),
        after: formatMoney({ amount: draft.priceAmount, currency: draft.priceCurrency }),
      })
    }
    if (current.status !== draft.status) {
      changes.push({ field: 'Estado', before: current.status, after: draft.status })
    }

    Object.assign(current, {
      title: draft.title,
      description: draft.description,
      operation: draft.operation,
      type: draft.type,
      status: draft.status,
      price: { amount: draft.priceAmount, currency: draft.priceCurrency },
      location: draft.location,
      features: draft.features,
      ownerId: draft.ownerId,
      agentId: draft.agentId,
      published: draft.published,
      updatedAt: new Date().toISOString().slice(0, 10),
    } satisfies Partial<Property>)

    recordAudit({
      userId: actingUserId,
      action: changes.some((change) => change.field === 'Precio') ? 'price_change' : 'update',
      entityKind: 'property',
      entityId: current.id,
      entityLabel: propertyShortLabel(current),
      summary: `Modificó la propiedad ${current.code}`,
      changes: changes.length > 0 ? changes : undefined,
    })

    return respond(current)
  },
}

/**
 * Property timeline: audit events for the property plus its own commercial
 * milestones (visits, leads, operations), newest first.
 */
function buildPropertyActivity(property: Property): ActivityEntry[] {
  const entries: ActivityEntry[] = []

  entries.push({
    id: `${property.id}-created`,
    at: property.createdAt,
    title: 'Propiedad creada',
    description: `Ingresó a la cartera como ${property.code}`,
    icon: 'property',
  })

  for (const audit of db.auditEvents) {
    if (audit.entityKind !== 'property' || audit.entityId !== property.id) continue
    entries.push({
      id: `activity-${audit.id}`,
      at: audit.at,
      userId: audit.userId,
      title: audit.summary,
      description: audit.changes
        ?.map((change) => `${change.field}: ${change.before} → ${change.after}`)
        .join(' · '),
      icon: audit.action === 'price_change' ? 'price' : 'property',
      entityKind: 'property',
      entityId: property.id,
    })
  }

  for (const visit of db.visits) {
    if (visit.propertyId !== property.id) continue
    const person = findPerson(visit.personId)
    entries.push({
      id: `activity-${visit.id}`,
      at: `${visit.date}T${visit.time}:00`,
      userId: visit.agentId,
      title: `Visita ${visit.status === 'done' ? 'realizada' : 'agendada'}`,
      description: person ? `${person.firstName} ${person.lastName}` : undefined,
      icon: 'visit',
      entityKind: 'visit',
      entityId: visit.id,
    })
  }

  for (const operation of db.operations) {
    if (operation.propertyId !== property.id) continue
    entries.push({
      id: `activity-${operation.id}`,
      at: operation.startedAt,
      userId: operation.agentId,
      title: `Operación ${operation.code} iniciada`,
      description: formatMoney(operation.price),
      icon: 'operation',
      entityKind: 'operation',
      entityId: operation.id,
    })
  }

  return entries.sort((a, b) => (a.at < b.at ? 1 : -1))
}
