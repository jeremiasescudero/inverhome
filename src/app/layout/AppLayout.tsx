import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { GlobalSearch } from './GlobalSearch'
import { NotificationsMenu } from './NotificationsMenu'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

/**
 * Application shell: fixed sidebar on desktop, drawer on smaller screens,
 * header with global search, notifications and the demo user switcher.
 */
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex min-h-screen flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            className="flex size-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-1">
            <NotificationsMenu />
            <UserMenu />
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
