import { NavLink } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { cn } from '@/lib/cn'
import type { Permission } from '@/lib/permissions'

const TABS: { to: string; label: string; permissions: Permission[] }[] = [
  { to: '/finanzas', label: 'Resumen', permissions: ['finance.view', 'finance.view_own_commissions'] },
  { to: '/finanzas/pagos', label: 'Pagos', permissions: ['payments.view'] },
  { to: '/finanzas/liquidaciones', label: 'Liquidaciones', permissions: ['settlements.view'] },
]

/** Sub-navigation shared by the finance screens, filtered by role. */
export function FinanceTabs() {
  const { can } = useSession()
  const visible = TABS.filter((tab) => tab.permissions.some((permission) => can(permission)))
  if (visible.length <= 1) return null

  return (
    <nav aria-label="Secciones de finanzas" className="flex gap-1 border-b border-slate-200">
      {visible.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors',
              isActive
                ? 'border-brand-600 font-medium text-brand-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
