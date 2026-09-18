import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/render'

const SECTIONS: { path: string; heading: string }[] = [
  { path: '/dashboard', heading: 'Dashboard' },
  { path: '/propiedades', heading: 'Propiedades' },
  { path: '/clientes', heading: 'Clientes' },
  { path: '/leads', heading: 'Leads' },
  { path: '/visitas', heading: 'Visitas' },
  { path: '/operaciones', heading: 'Operaciones' },
  { path: '/alquileres', heading: 'Alquileres' },
  { path: '/finanzas', heading: 'Finanzas' },
  { path: '/finanzas/pagos', heading: 'Finanzas' },
  { path: '/finanzas/liquidaciones', heading: 'Finanzas' },
  { path: '/documentos', heading: 'Documentos' },
  { path: '/reportes', heading: 'Reportes' },
  { path: '/auditoria', heading: 'Auditoría' },
  { path: '/usuarios', heading: 'Usuarios' },
  { path: '/configuracion', heading: 'Configuración' },
]

const SIDEBAR_LINKS = [
  'Dashboard',
  'Propiedades',
  'Clientes',
  'Leads',
  'Visitas',
  'Operaciones',
  'Alquileres',
  'Finanzas',
  'Documentos',
  'Reportes',
  'Auditoría',
  'Usuarios',
  'Configuración',
]

describe('Navegación', () => {
  it.each(SECTIONS)('renderiza $path como administrador', async ({ path, heading }) => {
    renderApp(path)
    expect(await screen.findByRole('heading', { name: heading, level: 1 })).toBeInTheDocument()
  })

  it('expone todas las secciones en el sidebar', () => {
    renderApp('/dashboard')
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    for (const label of SIDEBAR_LINKS) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('oculta y bloquea los módulos que el rol no puede ver', async () => {
    const { user } = renderApp('/usuarios')
    await screen.findByRole('heading', { name: 'Usuarios', level: 1 })

    // Switch the demo session to an agent, who cannot manage users.
    await user.click(screen.getByRole('button', { name: /Carlos Pérez/ }))
    await user.click(screen.getByRole('menuitemradio', { name: /Laura Gómez/ }))
    expect(await screen.findByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument()

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })
    expect(within(nav).queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: 'Auditoría' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Leads' })).toBeInTheDocument()

    // Direct navigation is refused too: the guard explains instead of redirecting.
    await user.click(screen.getByRole('link', { name: 'Finanzas' }))
    expect(await screen.findByRole('heading', { name: 'Finanzas', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Mis comisiones')).toBeInTheDocument()
    expect(screen.queryByText('Ingresos vs. egresos')).not.toBeInTheDocument()
  })

  it('muestra acceso restringido al entrar por URL sin permiso', async () => {
    const { user } = renderApp('/dashboard')
    await screen.findByRole('heading', { name: 'Dashboard', level: 1 })
    await user.click(screen.getByRole('button', { name: /Carlos Pérez/ }))
    await user.click(screen.getByRole('menuitemradio', { name: /Contador/ }))
    await screen.findByRole('heading', { name: 'Dashboard', level: 1 })

    // The global search still links to leads; an accountant lands on the guard.
    await user.type(screen.getByRole('combobox', { name: 'Búsqueda global' }), 'LEAD-0001')
    await user.click(await screen.findByRole('option', { name: /LEAD-0001/ }))
    expect(await screen.findByText('Acceso restringido')).toBeInTheDocument()
  })
})
