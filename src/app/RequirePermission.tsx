import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useSession } from '@/app/SessionContext'
import { ButtonLink, EmptyState } from '@/components/ui'
import { userRoleLabels } from '@/lib/labels'
import { canAny, type Permission } from '@/lib/permissions'

export interface RequirePermissionProps {
  anyOf: Permission[]
  children: ReactNode
}

/**
 * Route guard for the demo RBAC. It renders an explicit "restricted" state
 * instead of redirecting, so a reviewer switching roles sees *why* a module is
 * not available. In the real system the API rejects the request regardless.
 */
export function RequirePermission({ anyOf, children }: RequirePermissionProps) {
  const { user } = useSession()

  if (canAny(user.role, anyOf)) return <>{children}</>

  return (
    <main className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6">
      <EmptyState
        icon={<Lock className="size-5" aria-hidden="true" />}
        title="Acceso restringido"
        description={`El rol ${userRoleLabels[user.role]} no tiene permisos para ver esta sección. Cambiá de usuario desde el menú superior para revisarla.`}
        action={
          <ButtonLink to="/dashboard" size="sm">
            Volver al dashboard
          </ButtonLink>
        }
        className="rounded-lg border border-dashed border-slate-300 bg-white"
      />
    </main>
  )
}
