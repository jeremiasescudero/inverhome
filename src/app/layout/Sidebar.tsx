import { Building2, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { navigation } from '@/app/navigation'
import { cn } from '@/lib/cn'
import { canAny } from '@/lib/permissions'

export interface SidebarProps {
  /** Mobile drawer state; on large screens the sidebar is always visible. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useSession()

  const groups = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canAny(user.role, item.permissions)),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Barra lateral"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <NavLink to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <span className="flex size-7 items-center justify-center rounded-md bg-brand-600 text-white">
              <Building2 className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">Inverhome</span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Navegación principal" className="app-scrollbar flex-1 overflow-y-auto px-3 py-3">
          {groups.map((group, index) => (
            <div key={group.label ?? index} className={cn(index > 0 && 'mt-4')}>
              {group.label && (
                <p className="mb-1 px-2 text-2xs font-semibold tracking-wide text-slate-400 uppercase">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                          isActive
                            ? 'bg-brand-50 font-medium text-brand-800'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                        )
                      }
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <p className="border-t border-slate-200 px-4 py-2.5 text-2xs text-slate-400">
          Demo · datos ficticios sin persistencia
        </p>
      </aside>
    </>
  )
}
