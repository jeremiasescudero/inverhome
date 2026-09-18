import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SESSION_USER_ID, users } from '@/mocks/data/users'
import { can as roleCan, canEditProperty, type Permission } from '@/lib/permissions'
import type { Id, User } from '@/types'

/**
 * Demo session. There is no real authentication in this stage (spec section
 * 32); the impersonation picker exists so the RBAC model can be *demonstrated*
 * — it is a demo affordance, not a security boundary.
 */
export interface SessionValue {
  user: User
  users: User[]
  impersonate: (userId: Id) => void
  can: (permission: Permission) => boolean
  canEditProperty: (agentId: Id) => boolean
}

const SessionContext = createContext<SessionValue | undefined>(undefined)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id>(DEFAULT_SESSION_USER_ID)

  const user = useMemo(
    () => users.find((candidate) => candidate.id === userId) ?? users[0],
    [userId],
  )

  const impersonate = useCallback((nextUserId: Id) => setUserId(nextUserId), [])

  const value = useMemo<SessionValue>(
    () => ({
      user,
      users: users.filter((candidate) => candidate.status === 'active'),
      impersonate,
      can: (permission) => roleCan(user.role, permission),
      canEditProperty: (agentId) =>
        canEditProperty(user.role, { isOwnProperty: agentId === user.id }),
    }),
    [user, impersonate],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext)
  if (!context) throw new Error('useSession debe usarse dentro de SessionProvider')
  return context
}
