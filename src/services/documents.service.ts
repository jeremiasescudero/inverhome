import { db } from '@/mocks/db'
import type {
  DocumentFilters,
  EntityKind,
  Id,
  Page,
  PageRequest,
  StoredDocument,
} from '@/types'
import { matches, paginate, respond, sortBy } from './api'
import { userName } from './support/refs'

export interface DocumentListItem extends StoredDocument {
  uploadedByName: string
}

function toListItem(document: StoredDocument): DocumentListItem {
  return { ...document, uploadedByName: userName(document.uploadedById) }
}

export const documentsService = {
  list(
    filters: DocumentFilters = {},
    request: PageRequest = {},
  ): Promise<Page<DocumentListItem>> {
    const filtered = db.documents.filter((document) => {
      if (filters.search) {
        const haystack = [document.name, document.entityLabel, document.id].join(' ')
        if (!matches(haystack, filters.search)) return false
      }
      if (filters.type && filters.type !== 'all' && document.type !== filters.type) return false
      if (filters.status && filters.status !== 'all' && document.status !== filters.status) {
        return false
      }
      if (
        filters.entityKind &&
        filters.entityKind !== 'all' &&
        document.entityKind !== filters.entityKind
      ) {
        return false
      }
      return true
    })

    const sorted = sortBy(filtered, (document) => document.uploadedAt, request.sortDir ?? 'desc')
    const page = paginate(sorted, { pageSize: 12, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  /** Documents attached to one entity, for the detail pages. */
  forEntity(entityKind: EntityKind, entityId: Id): Promise<DocumentListItem[]> {
    const items = db.documents
      .filter((document) => document.entityKind === entityKind && document.entityId === entityId)
      .map(toListItem)
    return respond(items)
  },

  expiring(days = 45, today = '2026-09-16'): Promise<DocumentListItem[]> {
    const limit = new Date(today)
    limit.setDate(limit.getDate() + days)
    const limitIso = limit.toISOString().slice(0, 10)

    const items = db.documents
      .filter((document) => document.expiresAt && document.expiresAt <= limitIso)
      .sort((a, b) => (a.expiresAt ?? '').localeCompare(b.expiresAt ?? ''))
      .map(toListItem)
    return respond(items)
  },
}
