import type { UserRole } from '@/types'

/**
 * Conceptual RBAC model (spec section 21).
 *
 * The demo uses this matrix to decide what a role can see, but the rule it
 * documents is the important part: hiding a button is NOT security. A real
 * implementation must re-check every permission server-side, and this file is
 * meant to be the shared contract between that API and the UI.
 */
export type Permission =
  | 'dashboard.view'
  | 'properties.view'
  | 'properties.manage'
  | 'properties.manage_own'
  | 'clients.view'
  | 'clients.manage'
  | 'leads.view'
  | 'leads.manage'
  | 'visits.view'
  | 'visits.manage'
  | 'operations.view'
  | 'operations.manage'
  | 'rentals.view'
  | 'rentals.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'finance.view'
  | 'finance.view_own_commissions'
  | 'settlements.view'
  | 'settlements.manage'
  | 'documents.view'
  | 'documents.manage'
  | 'reports.view'
  | 'audit.view'
  | 'users.view'
  | 'users.manage'
  | 'settings.view'
  | 'settings.manage'

const ALL_PERMISSIONS: Permission[] = [
  'dashboard.view',
  'properties.view',
  'properties.manage',
  'properties.manage_own',
  'clients.view',
  'clients.manage',
  'leads.view',
  'leads.manage',
  'visits.view',
  'visits.manage',
  'operations.view',
  'operations.manage',
  'rentals.view',
  'rentals.manage',
  'payments.view',
  'payments.manage',
  'finance.view',
  'finance.view_own_commissions',
  'settlements.view',
  'settlements.manage',
  'documents.view',
  'documents.manage',
  'reports.view',
  'audit.view',
  'users.view',
  'users.manage',
  'settings.view',
  'settings.manage',
]

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: ALL_PERMISSIONS,

  manager: [
    'dashboard.view',
    'properties.view',
    'properties.manage',
    'clients.view',
    'clients.manage',
    'leads.view',
    'leads.manage',
    'visits.view',
    'visits.manage',
    'operations.view',
    'operations.manage',
    'rentals.view',
    'rentals.manage',
    'payments.view',
    'finance.view',
    'settlements.view',
    'documents.view',
    'documents.manage',
    'reports.view',
    'audit.view',
    'settings.view',
  ],

  // Agents work on their own portfolio and never see company-wide finance.
  agent: [
    'dashboard.view',
    'properties.view',
    'properties.manage_own',
    'clients.view',
    'clients.manage',
    'leads.view',
    'leads.manage',
    'visits.view',
    'visits.manage',
    'operations.view',
    'finance.view_own_commissions',
    'documents.view',
  ],

  back_office: [
    'dashboard.view',
    'properties.view',
    'clients.view',
    'clients.manage',
    'operations.view',
    'operations.manage',
    'rentals.view',
    'rentals.manage',
    'payments.view',
    'payments.manage',
    'settlements.view',
    'settlements.manage',
    'documents.view',
    'documents.manage',
    'reports.view',
  ],

  accountant: [
    'dashboard.view',
    'properties.view',
    'operations.view',
    'rentals.view',
    'payments.view',
    'finance.view',
    'settlements.view',
    'documents.view',
    'reports.view',
  ],
}

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export function canAny(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission))
}

/** True when the role may edit a property, considering ownership. */
export function canEditProperty(
  role: UserRole,
  options: { isOwnProperty: boolean },
): boolean {
  if (can(role, 'properties.manage')) return true
  return can(role, 'properties.manage_own') && options.isOwnProperty
}
