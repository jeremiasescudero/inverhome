import type { EntityKind, Id, IsoDate } from './common'

export type ActivityIcon =
  | 'property'
  | 'client'
  | 'lead'
  | 'visit'
  | 'operation'
  | 'payment'
  | 'document'
  | 'price'
  | 'user'

/**
 * Human-readable feed entry. Activity is derived from audit events plus domain
 * milestones, and is what the dashboard and detail timelines render.
 */
export interface ActivityEntry {
  id: Id
  at: IsoDate
  userId?: Id
  title: string
  description?: string
  icon: ActivityIcon
  entityKind?: EntityKind
  entityId?: Id
}

export type AlertSeverity = 'critical' | 'attention' | 'info'

export interface Alert {
  id: Id
  severity: AlertSeverity
  title: string
  description: string
  href?: string
}

export interface UpcomingEvent {
  id: Id
  at: IsoDate
  kind: 'visit' | 'payment' | 'contract' | 'adjustment' | 'task'
  title: string
  description?: string
  href?: string
}

export interface AppNotification {
  id: Id
  title: string
  description?: string
  at: IsoDate
  read: boolean
  href?: string
  tone: 'info' | 'attention' | 'critical'
}
