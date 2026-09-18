import type { Id, IsoDate } from './common'

export type UserRole = 'admin' | 'manager' | 'agent' | 'back_office' | 'accountant'

export type UserStatus = 'active' | 'inactive' | 'blocked'

export interface User {
  id: Id
  name: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  /** Agents are the only users that can own properties, leads and visits. */
  isAgent: boolean
  createdAt: IsoDate
  lastAccessAt?: IsoDate
  avatarColor: string
}
