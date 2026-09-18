import { db, DEMO_TODAY } from '@/mocks/db'
import type {
  Id,
  Page,
  PageRequest,
  Person,
  Property,
  User,
  Visit,
  VisitFilters,
  VisitStatus,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'
import {
  findPerson,
  findProperty,
  findUser,
  formatAddress,
  personName,
  propertyLabel,
} from './support/refs'

export interface VisitListItem {
  id: Id
  code: string
  date: string
  time: string
  status: VisitStatus
  outcome?: Visit['outcome']
  propertyId: Id
  propertyTitle: string
  propertyAddress: string
  personId: Id
  personName: string
  agentId: Id
  agentName: string
  comments?: string
  leadId?: Id
}

/** Visits grouped by day, which is how the agenda renders them. */
export interface VisitDay {
  date: string
  items: VisitListItem[]
}

export interface VisitDetail {
  visit: Visit
  property: Property | undefined
  person: Person | undefined
  agent: User | undefined
}

function toListItem(visit: Visit): VisitListItem {
  const property = findProperty(visit.propertyId)
  return {
    id: visit.id,
    code: visit.code,
    date: visit.date,
    time: visit.time,
    status: visit.status,
    outcome: visit.outcome,
    propertyId: visit.propertyId,
    propertyTitle: property?.title ?? 'Propiedad',
    propertyAddress: property ? formatAddress(property.location) : '',
    personId: visit.personId,
    personName: personName(visit.personId),
    agentId: visit.agentId,
    agentName: findUser(visit.agentId)?.name ?? 'Sin asignar',
    comments: visit.comments,
    leadId: visit.leadId,
  }
}

function applyFilters(items: Visit[], filters: VisitFilters): Visit[] {
  return items.filter((visit) => {
    if (filters.search) {
      const haystack = [
        visit.code,
        propertyLabel(visit.propertyId),
        personName(visit.personId),
        visit.comments ?? '',
      ].join(' ')
      if (!matches(haystack, filters.search)) return false
    }
    if (filters.status && filters.status !== 'all' && visit.status !== filters.status) return false
    if (filters.agentId && filters.agentId !== 'all' && visit.agentId !== filters.agentId) {
      return false
    }
    if (filters.from && visit.date < filters.from) return false
    if (filters.to && visit.date > filters.to) return false
    return true
  })
}

const OPEN_STATUSES: VisitStatus[] = ['scheduled', 'confirmed']

export const visitsService = {
  list(filters: VisitFilters = {}, request: PageRequest = {}): Promise<Page<VisitListItem>> {
    const filtered = applyFilters(db.visits, filters)
    const sorted = sortBy(
      filtered,
      (visit) => `${visit.date}T${visit.time}`,
      request.sortDir ?? 'desc',
    )
    const page = paginate(sorted, { pageSize: 15, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  /** Agenda from `from` onwards, grouped by day. */
  agenda(filters: VisitFilters = {}, from: string = DEMO_TODAY): Promise<VisitDay[]> {
    const filtered = applyFilters(db.visits, filters).filter((visit) => visit.date >= from)
    const byDay = new Map<string, VisitListItem[]>()
    for (const visit of sortBy(filtered, (item) => `${item.date}T${item.time}`, 'asc')) {
      const bucket = byDay.get(visit.date) ?? []
      bucket.push(toListItem(visit))
      byDay.set(visit.date, bucket)
    }
    return respond([...byDay.entries()].map(([date, items]) => ({ date, items })))
  },

  upcoming(limit = 5, from: string = DEMO_TODAY): Promise<VisitListItem[]> {
    const items = db.visits
      .filter((visit) => visit.date >= from && OPEN_STATUSES.includes(visit.status))
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
      .slice(0, limit)
      .map(toListItem)
    return respond(items)
  },

  getById(id: Id): Promise<VisitDetail> {
    const visit = db.visits.find((item) => item.id === id)
    if (!visit) return Promise.reject(notFound('la visita', id))
    return respond({
      visit,
      property: findProperty(visit.propertyId),
      person: findPerson(visit.personId),
      agent: findUser(visit.agentId),
    })
  },

  changeStatus(id: Id, status: VisitStatus, actingUserId: Id): Promise<Visit> {
    const visit = db.visits.find((item) => item.id === id)
    if (!visit) return Promise.reject(notFound('la visita', id))
    const before = visit.status
    if (before === status) return respond(visit)
    visit.status = status
    recordAudit({
      userId: actingUserId,
      action: 'status_change',
      entityKind: 'visit',
      entityId: visit.id,
      entityLabel: `${visit.code} — ${propertyLabel(visit.propertyId)}`,
      summary: `Cambió el estado de la visita ${visit.code}`,
      changes: [{ field: 'Estado', before, after: status }],
    })
    return respond(visit)
  },
}
