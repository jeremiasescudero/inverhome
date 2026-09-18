import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/render'

describe('Clientes', () => {
  it('lista los clientes con sus roles', async () => {
    renderApp('/clientes')
    const table = await screen.findByRole('table', { name: 'Listado de clientes' })
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(5))
    expect(screen.getByText(/de 15 clientes/)).toBeInTheDocument()
    expect(within(table).getAllByText('Propietario').length).toBeGreaterThan(0)
  })

  it('abre el detalle con sus propiedades y actividad', async () => {
    const { user } = renderApp('/clientes')
    await screen.findByRole('table', { name: 'Listado de clientes' })
    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Alvarez')
    await user.click(await screen.findByText('Roberto Álvarez'))

    expect(await screen.findByRole('heading', { name: 'Roberto Álvarez', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Información personal')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Propiedades/ })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Actividad/ }))
    expect(screen.getByText('Cliente registrado')).toBeInTheDocument()
  })
})
