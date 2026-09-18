import { screen, waitFor, within } from '@testing-library/react'
import { renderApp } from '@/test/render'

describe('Propiedades', () => {
  it('lista la cartera con paginación', async () => {
    renderApp('/propiedades')
    expect(await screen.findByRole('heading', { name: 'Propiedades', level: 1 })).toBeInTheDocument()

    const table = await screen.findByRole('table', { name: 'Listado de propiedades' })
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(5))
    expect(screen.getByText(/de 20 propiedades/)).toBeInTheDocument()
  })

  it('filtra por búsqueda y estado', async () => {
    const { user } = renderApp('/propiedades')
    await screen.findByRole('table', { name: 'Listado de propiedades' })

    await user.type(screen.getByRole('searchbox', { name: 'Buscar' }), 'Güemes')
    await waitFor(() => expect(screen.getByText(/de 1 propiedades/)).toBeInTheDocument())
    expect(screen.getByText('Departamento 1 dormitorio en Güemes')).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox', { name: 'Buscar' }))
    await user.selectOptions(screen.getByLabelText('Estado'), 'sold')
    await waitFor(() => {
      const table = screen.getByRole('table', { name: 'Listado de propiedades' })
      expect(within(table).getAllByText('Vendida').length).toBeGreaterThan(0)
      expect(within(table).queryByText('Disponible')).not.toBeInTheDocument()
    })
    expect(screen.queryByText(/de 20 propiedades/)).not.toBeInTheDocument()
  })

  it('abre el detalle desde el listado', async () => {
    const { user } = renderApp('/propiedades')
    const row = await screen.findByText('Departamento 2 dormitorios en Nueva Córdoba')
    await user.click(row)

    expect(
      await screen.findByRole('heading', { name: 'Departamento 2 dormitorios en Nueva Córdoba', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Características')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Actividad/ })).toBeInTheDocument()
  })

  it('crea una propiedad en el estado local y navega a su ficha', async () => {
    const { user } = renderApp('/propiedades/nueva')
    expect(await screen.findByRole('heading', { name: 'Nueva propiedad', level: 1 })).toBeInTheDocument()

    // Submitting empty shows the visual validation instead of saving.
    await user.click(screen.getByRole('button', { name: 'Crear propiedad' }))
    expect(await screen.findByText('Ingresá un título de al menos 8 caracteres.')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^Título/), 'Casa de prueba en Arguello')
    await user.type(
      screen.getByLabelText(/^Descripción/),
      'Casa de prueba creada desde el test para validar el flujo de alta completo.',
    )
    await user.type(screen.getByLabelText(/^Calle/), 'Av. Rafael Núñez')
    await user.type(screen.getByLabelText(/^Número/), '4800')
    await user.type(screen.getByLabelText(/^Barrio/), 'Argüello')
    await user.clear(screen.getByLabelText(/Superficie total/))
    await user.type(screen.getByLabelText(/Superficie total/), '180')
    await user.clear(screen.getByLabelText(/^Monto/))
    await user.type(screen.getByLabelText(/^Monto/), '150000')

    await user.click(screen.getByRole('button', { name: 'Crear propiedad' }))

    expect(await screen.findByRole('heading', { name: 'Casa de prueba en Arguello', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('PROP-0021').length).toBeGreaterThan(0)
    expect(await screen.findByRole('status')).toHaveTextContent('Propiedad creada')
  })
})
