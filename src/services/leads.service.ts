import { db } from '@/mocks/db'
import { fullName } from '@/lib/format'
import { leadStageOrder } from '@/lib/labels'
import type {
  Id,
  Lead,
  LeadFilters,
  LeadStage,
  Page,
  PageRequest,
  Person,
  Property,
  User,
  Visit,
} from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'
import { findPerson, findProperty, findUser, personName, propertyLabel } from './support/refs'

export interface LeadListItem {
  id: Id
  code: string
  personId: Id
  personName: string
  personPhone: string
  propertyId?: Id
  propertyLabel: string
  source: Lead['source']
  stage: LeadStage
  priority: Lead['priority']
  agentId: Id
  agentName: string
  createdAt: string
  nextContactAt?: string
  notes: string
}

export interface LeadBoardColumn {
  stage: LeadStage
  items: LeadListItem[]
}

export interface LeadDetail {
  lead: Lead
  person: Person | undefined
  property: Property | undefined
  agent: User | undefined
  visits: Visit[]
}

function toListItem(lead: Lead): LeadListItem {
  const person = findPerson(lead.personId)
  return {
    id: lead.id,
    code: lead.code,
    personId: lead.personId,
    personName: person ? fullName(person) : 'Sin cliente',
    personPhone: person?.phone ?? '',
    propertyId: lead.propertyId,
    propertyLabel: lead.propertyId ? propertyLabel(lead.propertyId) : 'Consulta general',
    source: lead.source,
    stage: lead.stage,
    priority: lead.priority,
    agentId: lead.agentId,
    agentName: findUser(lead.agentId)?.name ?? 'Sin asignar',
    createdAt: lead.createdAt,
    nextContactAt: lead.nextContactAt,
    notes: lead.notes,
  }
}

function applyFilters(items: Lead[], filters: LeadFilters): Lead[] {
  return items.filter((lead) => {
    if (filters.search) {
      const haystack = [
        lead.code,
        personName(lead.personId),
        lead.propertyId ? propertyLabel(lead.propertyId) : '',
        lead.notes,
      ].join(' ')
      if (!matches(haystack, filters.search)) return false
    }
    if (filters.stage && filters.stage !== 'all' && lead.stage !== filters.stage) return false
    if (filters.priority && filters.priority !== 'all' && lead.priority !== filters.priority) {
      return false
    }
    if (filters.agentId && filters.agentId !== 'all' && lead.agentId !== filters.agentId) {
      return false
    }
    if (filters.source && filters.source !== 'all' && lead.source !== filters.source) return false
    return true
  })
}

export const leadsService = {
  list(filters: LeadFilters = {}, request: PageRequest = {}): Promise<Page<LeadListItem>> {
    const filtered = applyFilters(db.leads, filters)
    const sorted = sortBy(filtered, (lead) => lead.createdAt, request.sortDir ?? 'desc')
    const page = paginate(sorted, { pageSize: 15, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  /** Kanban view: every stage always present, even when empty. */
  board(filters: LeadFilters = {}): Promise<LeadBoardColumn[]> {
    const filtered = applyFilters(db.leads, filters)
    return respond(
      leadStageOrder.map((stage) => ({
        stage,
        items: filtered
          .filter((lead) => lead.stage === stage)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
          .map(toListItem),
      })),
    )
  },

  getById(id: Id): Promise<LeadDetail> {
    const lead = db.leads.find((item) => item.id === id)
    if (!lead) return Promise.reject(notFound('el lead', id))
    return respond({
      lead,
      person: findPerson(lead.personId),
      property: findProperty(lead.propertyId),
      agent: findUser(lead.agentId),
      visits: db.visits.filter((visit) => visit.leadId === lead.id),
    })
  },

  changeStage(id: Id, stage: LeadStage, actingUserId: Id): Promise<Lead> {
    const lead = db.leads.find((item) => item.id === id)
    if (!lead) return Promise.reject(notFound('el lead', id))
    const before = lead.stage
    if (before === stage) return respond(lead)
    lead.stage = stage
    recordAudit({
      userId: actingUserId,
      action: 'status_change',
      entityKind: 'lead',
      entityId: lead.id,
      entityLabel: `${lead.code} — ${personName(lead.personId)}`,
      summary: `Cambió la etapa del lead ${lead.code}`,
      changes: [{ field: 'Etapa', before, after: stage }],
    })
    return respond(lead)
  },
}
