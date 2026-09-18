import type { Id, IsoDate } from './common'

export type VisitStatus = 'scheduled' | 'confirmed' | 'done' | 'cancelled' | 'no_show'

export type VisitOutcome = 'interested' | 'not_interested' | 'offer' | 'pending'

export interface Visit {
  id: Id
  code: string
  propertyId: Id
  personId: Id
  agentId: Id
  /** Date and time are kept apart so the agenda can group by day cheaply. */
  date: IsoDate
  time: string
  status: VisitStatus
  outcome?: VisitOutcome
  comments?: string
  leadId?: Id
}

export interface VisitFilters {
  search?: string
  status?: VisitStatus | 'all'
  agentId?: Id | 'all'
  from?: IsoDate
  to?: IsoDate
}
