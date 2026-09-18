import { db } from '@/mocks/db'
import type { AuditEvent, AuditFilters, Id, Page, PageRequest } from '@/types'
import { matches, paginate, respond, sortBy } from './api'
import { findUser } from './support/refs'

export interface AuditListItem extends AuditEvent {
  userName: string
  userRole: string
  avatarColor: string
}

function toListItem(event: AuditEvent): AuditListItem {
  const user = findUser(event.userId)
  return {
    ...event,
    userName: user?.name ?? 'Usuario eliminado',
    userRole: user?.role ?? 'admin',
    avatarColor: user?.avatarColor ?? 'bg-slate-500',
  }
}

export const auditService = {
  list(filters: AuditFilters = {}, request: PageRequest = {}): Promise<Page<AuditListItem>> {
    const filtered = db.auditEvents.filter((event) => {
      if (filters.search) {
        const haystack = [event.summary, event.entityLabel, event.entityId].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.userId && filters.userId !== 'all' && event.userId !== filters.userId) {
        return false
      }
      if (filters.action && filters.action !== 'all' && event.action !== filters.action) {
        return false
      }
      if (
        filters.entityKind &&
        filters.entityKind !== 'all' &&
        event.entityKind !== filters.entityKind
      ) {
        return false
      }
      if (filters.from && event.at.slice(0, 10) < filters.from) return false
      if (filters.to && event.at.slice(0, 10) > filters.to) return false
      return true
    })

    const sorted = sortBy(filtered, (event) => event.at, request.sortDir ?? 'desc')
    const page = paginate(sorted, { pageSize: 15, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  /** Recent events for one entity, used by detail timelines. */
  forEntity(entityId: Id, limit = 10): Promise<AuditListItem[]> {
    const items = db.auditEvents
      .filter((event) => event.entityId === entityId)
      .slice(0, limit)
      .map(toListItem)
    return respond(items)
  },
}
