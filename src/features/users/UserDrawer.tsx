import { useId } from 'react'
import { Avatar, Badge, Button, DescriptionList, Drawer, ErrorState, LoadingState, StatusBadge } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatDateTime } from '@/lib/format'
import { userRoleLabels, userStatusMeta } from '@/lib/labels'
import { rolePermissions } from '@/lib/permissions'
import { usersService } from '@/services'
import type { UserRole, UserStatus } from '@/types'

export interface UserDrawerProps {
  userId: string | undefined
  onClose: () => void
  onChangeRole?: (id: string, role: UserRole) => void
  onChangeStatus?: (id: string, status: UserStatus) => void
  isSelf: boolean
}

/** Groups a role's permissions by module for a readable summary. */
function permissionSummary(role: UserRole): { module: string; access: string }[] {
  const grouped = new Map<string, Set<string>>()
  for (const permission of rolePermissions[role]) {
    const [module, action] = permission.split('.')
    grouped.set(module, (grouped.get(module) ?? new Set()).add(action))
  }
  return [...grouped.entries()].map(([module, actions]) => ({
    module,
    access: actions.has('manage') ? 'Gestión' : actions.has('manage_own') ? 'Gestión propia' : 'Consulta',
  }))
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  properties: 'Propiedades',
  clients: 'Clientes',
  leads: 'Leads',
  visits: 'Visitas',
  operations: 'Operaciones',
  rentals: 'Alquileres',
  payments: 'Pagos',
  finance: 'Finanzas',
  settlements: 'Liquidaciones',
  documents: 'Documentos',
  reports: 'Reportes',
  audit: 'Auditoría',
  users: 'Usuarios',
  settings: 'Configuración',
}

export function UserDrawer({ userId, onClose, onChangeRole, onChangeStatus, isSelf }: UserDrawerProps) {
  const roleId = useId()
  const detail = useAsync(() => (userId ? usersService.getById(userId) : Promise.resolve(undefined)), [userId])
  const user = detail.data

  return (
    <Drawer
      open={Boolean(userId)}
      onClose={onClose}
      title={user?.name ?? 'Usuario'}
      description={user ? userRoleLabels[user.role] : undefined}
      footer={
        onChangeStatus &&
        user &&
        !isSelf && (
          <>
            {user.status === 'active' ? (
              <>
                <Button size="sm" variant="danger" onClick={() => onChangeStatus(user.id, 'blocked')}>
                  Bloquear
                </Button>
                <Button size="sm" onClick={() => onChangeStatus(user.id, 'inactive')}>
                  Desactivar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" onClick={() => onChangeStatus(user.id, 'active')}>
                Reactivar
              </Button>
            )}
          </>
        )
      }
    >
      {detail.loading && <LoadingState rows={4} className="px-0" />}
      {detail.error && <ErrorState description={detail.error.message} onRetry={detail.reload} />}
      {user && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} color={user.avatarColor} size="md" />
            <div>
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <StatusBadge meta={userStatusMeta[user.status]} className="ml-auto" />
          </div>

          <DescriptionList
            columns={2}
            items={[
              { label: 'Teléfono', value: user.phone ?? '—' },
              { label: 'Alta', value: formatDate(user.createdAt) },
              { label: 'Último acceso', value: formatDateTime(user.lastAccessAt), wide: true },
            ]}
          />

          {onChangeRole && (
            <div className="flex flex-col gap-1 rounded-md border border-brand-200 bg-brand-50/50 px-3 py-2">
              <label htmlFor={roleId} className="text-2xs font-medium tracking-wide text-brand-800 uppercase">
                Rol
              </label>
              <select
                id={roleId}
                value={user.role}
                disabled={isSelf}
                onChange={(event) => onChangeRole(user.id, event.target.value as UserRole)}
                className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
              >
                {(Object.keys(userRoleLabels) as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {userRoleLabels[role]}
                  </option>
                ))}
              </select>
              {isSelf && <p className="text-2xs text-slate-500">No podés cambiar tu propio rol.</p>}
            </div>
          )}

          <section>
            <h3 className="mb-2 text-2xs font-medium tracking-wide text-slate-500 uppercase">
              Permisos del rol {userRoleLabels[user.role]}
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {permissionSummary(user.role).map((item) => (
                <li key={item.module}>
                  <Badge tone={item.access === 'Consulta' ? 'neutral' : 'info'}>
                    {MODULE_LABELS[item.module] ?? item.module}: {item.access}
                  </Badge>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-2xs text-slate-500">
              En el sistema real estos permisos se validan en la API, no sólo en la interfaz.
            </p>
          </section>
        </div>
      )}
    </Drawer>
  )
}
