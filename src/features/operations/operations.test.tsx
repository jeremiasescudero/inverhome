import { screen, within } from '@testing-library/react'
import { renderApp } from '@/test/render'

describe('Operaciones', () => {
  it('muestra la operación con su progreso y partes', async () => {
    renderApp('/operaciones/OP-0002')
    expect(await screen.findByRole('heading', { name: /OP-0002/, level: 1 })).toBeInTheDocument()
    expect(screen.getByText('Progreso')).toBeInTheDocument()
    expect(screen.getByText('Condiciones económicas')).toBeInTheDocument()
    expect(screen.getByText('Partes')).toBeInTheDocument()
  })

  it('avanza el estado de la operación', async () => {
    const { user } = renderApp('/operaciones/OP-0002')
    await screen.findByRole('heading', { name: /OP-0002/, level: 1 })

    await user.click(screen.getByRole('button', { name: 'Avanzar a Negociación' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Operación actualizada')
    expect(await screen.findByRole('button', { name: 'Avanzar a Documentación' })).toBeInTheDocument()
    const progress = screen.getByText('Progreso').closest('section')
    expect(progress).not.toBeNull()
    expect(within(progress as HTMLElement).getByText('Negociación').closest('span')).toHaveAttribute(
      'aria-current',
      'step',
    )
  })
})
