import { render, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders, AppRoutes } from '@/App'
import { resetDb } from '@/mocks/db'

/**
 * Mounts the real route tree at a given path with the demo providers, on a
 * pristine copy of the mock database. Tests exercise the app the way a
 * reviewer would: through the rendered screens, not the services.
 */
export function renderApp(path = '/dashboard'): RenderResult & { user: ReturnType<typeof userEvent.setup> } {
  resetDb()
  const user = userEvent.setup()
  const result = render(
    <AppProviders>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  )
  return { ...result, user }
}
