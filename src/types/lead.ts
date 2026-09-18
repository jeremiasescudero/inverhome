import type { Id, IsoDate } from './common'

export type LeadStage =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'visit_scheduled'
  | 'negotiation'
  | 'won'
  | 'lost'

export type LeadSource =
  | 'portal'
  | 'website'
  | 'referral'
  | 'walk_in'
  | 'phone'
  | 'social'
  | 'sign'

export type LeadPriority = 'low' | 'medium' | 'high'

export interface Lead {
  id: Id
  code: string
  personId: Id
  propertyId?: Id
  source: LeadSource
  stage: LeadStage
  priority: LeadPriority
  agentId: Id
  createdAt: IsoDate
  nextContactAt?: IsoDate
  notes: string
}

export interface LeadFilters {
  search?: string
  stage?: LeadStage | 'all'
  priority?: LeadPriority | 'all'
  agentId?: Id | 'all'
  source?: LeadSource | 'all'
}
