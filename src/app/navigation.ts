import {
  Banknote,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  Handshake,
  KeyRound,
  LayoutDashboard,
  PieChart,
  ScrollText,
  Settings,
  Users,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/permissions'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Any of these permissions makes the entry visible for the current role. */
  permissions: Permission[]
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

/**
 * Sidebar structure (spec section 4). Visibility is decided by role, but the
 * same permission is re-checked by the route guard: hiding a link is a UX
 * nicety, not the access control.
 */
export const navigation: NavGroup[] = [
  {
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permissions: ['dashboard.view'] },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { to: '/propiedades', label: 'Propiedades', icon: Building2, permissions: ['properties.view'] },
      { to: '/clientes', label: 'Clientes', icon: UsersRound, permissions: ['clients.view'] },
      { to: '/leads', label: 'Leads', icon: Handshake, permissions: ['leads.view'] },
      { to: '/visitas', label: 'Visitas', icon: CalendarDays, permissions: ['visits.view'] },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/operaciones', label: 'Operaciones', icon: Briefcase, permissions: ['operations.view'] },
      { to: '/alquileres', label: 'Alquileres', icon: KeyRound, permissions: ['rentals.view'] },
      {
        to: '/finanzas',
        label: 'Finanzas',
        icon: Banknote,
        permissions: ['finance.view', 'payments.view', 'finance.view_own_commissions'],
      },
      { to: '/documentos', label: 'Documentos', icon: FileText, permissions: ['documents.view'] },
    ],
  },
  {
    label: 'Análisis',
    items: [{ to: '/reportes', label: 'Reportes', icon: PieChart, permissions: ['reports.view'] }],
  },
  {
    label: 'Administración',
    items: [
      { to: '/auditoria', label: 'Auditoría', icon: ScrollText, permissions: ['audit.view'] },
      { to: '/usuarios', label: 'Usuarios', icon: Users, permissions: ['users.view'] },
      { to: '/configuracion', label: 'Configuración', icon: Settings, permissions: ['settings.view'] },
    ],
  },
]
