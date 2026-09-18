import { db } from '@/mocks/db'
import type { Id, Page, PageRequest, User, UserRole, UserStatus } from '@/types'
import { matches, notFound, paginate, respond, sortBy } from './api'
import { recordAudit } from './support/audit-log'

export interface UserFilters {
  search?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
}

export interface UserListItem extends User {
  /** Properties currently assigned to the user, when they are an agent. */
  assignedProperties: number
  openLeads: number
}

function toListItem(user: User): UserListItem {
  return {
    ...user,
    assignedProperties: db.properties.filter((property) => property.agentId === user.id).length,
    openLeads: db.leads.filter(
      (lead) => lead.agentId === user.id && lead.stage !== 'won' && lead.stage !== 'lost',
    ).length,
  }
}

export const usersService = {
  list(filters: UserFilters = {}, request: PageRequest = {}): Promise<Page<UserListItem>> {
    const filtered = db.users.filter((user) => {
      if (filters.search && !matches(`${user.name} ${user.email}`, filters.search)) return false
      if (filters.role && filters.role !== 'all' && user.role !== filters.role) return false
      if (filters.status && filters.status !== 'all' && user.status !== filters.status) return false
      return true
    })

    const sorted = sortBy(filtered, (user) => user.name, request.sortDir ?? 'asc')
    const page = paginate(sorted, { pageSize: 10, ...request })
    return respond({ ...page, items: page.items.map(toListItem) })
  },

  getById(id: Id): Promise<User> {
    const user = db.users.find((item) => item.id === id)
    if (!user) return Promise.reject(notFound('el usuario', id))
    return respond(user)
  },

  /** Active agents, for the assignment pickers. */
  agents(): Promise<User[]> {
    return respond(db.users.filter((user) => user.isAgent && user.status === 'active'))
  },

  all(): Promise<User[]> {
    return respond(db.users)
  },

  changeRole(id: Id, role: UserRole, actingUserId: Id): Promise<User> {
    const user = db.users.find((item) => item.id === id)
    if (!user) return Promise.reject(notFound('el usuario', id))
    const before = user.role
    if (before === role) return respond(user)
    user.role = role
    user.isAgent = role === 'agent'
    recordAudit({
      userId: actingUserId,
      action: 'permission_change',
      entityKind: 'user',
      entityId: user.id,
      entityLabel: `${user.id} — ${user.name}`,
      summary: `Cambió el rol de ${user.name}`,
      changes: [{ field: 'Rol', before, after: role }],
    })
    return respond(user)
  },

  changeStatus(id: Id, status: UserStatus, actingUserId: Id): Promise<User> {
    const user = db.users.find((item) => item.id === id)
    if (!user) return Promise.reject(notFound('el usuario', id))
    const before = user.status
    if (before === status) return respond(user)
    user.status = status
    recordAudit({
      userId: actingUserId,
      action: 'permission_change',
      entityKind: 'user',
      entityId: user.id,
      entityLabel: `${user.id} — ${user.name}`,
      summary: `Cambió el estado de ${user.name}`,
      changes: [{ field: 'Estado', before, after: status }],
    })
    return respond(user)
  },

  create(
    input: { name: string; email: string; role: UserRole; phone?: string },
    actingUserId: Id,
  ): Promise<User> {
    const nextNumber = db.users.length + 1
    const user: User = {
      id: `USR-${String(nextNumber).padStart(3, '0')}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      status: 'active',
      isAgent: input.role === 'agent',
      createdAt: new Date().toISOString().slice(0, 10),
      avatarColor: 'bg-slate-600',
    }
    db.users.push(user)
    recordAudit({
      userId: actingUserId,
      action: 'create',
      entityKind: 'user',
      entityId: user.id,
      entityLabel: `${user.id} — ${user.name}`,
      summary: `Creó el usuario ${user.name}`,
    })
    return respond(user)
  },
}
