import { screen, waitFor, within } from '@testing-library/react'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/render'

describe('Leads', () => {
  it('muestra el tablero con una columna por etapa', async () => {
    renderApp('/leads')
    const board = await screen.findByRole('list', { name: 'Tablero de leads por etapa' })
    await waitFor(() => expect(within(board).getAllByRole('listitem').length).toBeGreaterThanOrEqual(7))
    expect(within(board).getByRole('listitem', { name: /^Nuevo:/ })).toBeInTheDocument()
    expect(within(board).getByRole('listitem', { name: /^Convertido:/ })).toBeInTheDocument()
  })

  it('cambia la etapa de un lead y lo registra en auditoría', async () => {
    const { user } = renderApp('/leads')
    const board = await screen.findByRole('list', { name: 'Tablero de leads por etapa' })
    const newColumn = await within(board).findByRole('listitem', { name: /^Nuevo:/ })
    const initialCount = within(newColumn).getAllByRole('button', { name: /Mover a/ }).length
    expect(initialCount).toBeGreaterThan(0)

    await user.click(within(newColumn).getAllByRole('button', { name: /Mover a Contactado/ })[0])

    expect(await screen.findByRole('status')).toHaveTextContent('Etapa actualizada')
    await waitFor(() => {
      const refreshed = within(board).getByRole('listitem', { name: /^Nuevo:/ })
      expect(within(refreshed).queryAllByRole('button', { name: /Mover a/ })).toHaveLength(initialCount - 1)
    })
    expect(db.auditEvents[0]).toMatchObject({ action: 'status_change', entityKind: 'lead' })
  })

  it('abre el detalle completo de un lead', async () => {
    renderApp('/leads/LEAD-0001')
    expect(await screen.findByRole('heading', { name: /LEAD-0001/, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Seguimiento')).toBeInTheDocument()
    expect(screen.getByLabelText('Mover a etapa')).toHaveValue('negotiation')
  })
})
