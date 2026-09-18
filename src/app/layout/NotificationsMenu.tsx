import { AlertTriangle, Bell, Clock, Info } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { notificationsService } from '@/services'
import type { AppNotification } from '@/types'

const TONE_ICON: Record<AppNotification['tone'], { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: 'text-sky-600 bg-sky-50' },
  attention: { icon: Clock, className: 'text-amber-700 bg-amber-50' },
  critical: { icon: AlertTriangle, className: 'text-rose-600 bg-rose-50' },
}

/** Bell menu with notifications derived from the mock data (spec section 27). */
export function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)
  const { data } = useAsync(() => notificationsService.list(), [open])

  const items = (data ?? []).map((item) => ({ ...item, read: item.read || readIds.has(item.id) }))
  const unread = items.filter((item) => !item.read).length

  useEffect(() => {
    if (!open) return
    function onClickOutside(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function markAllRead() {
    setReadIds(new Set(items.map((item) => item.id)))
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      >
        <Bell className="size-4.5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-2xs font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg sm:w-96"
        >
          <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-brand-700 hover:underline"
              >
                Marcar todas como leídas
              </button>
            )}
          </header>
          <ul className="app-scrollbar max-h-96 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-slate-500">
                No hay notificaciones.
              </li>
            )}
            {items.map((item) => {
              const { icon: Icon, className } = TONE_ICON[item.tone]
              const content = (
                <>
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md',
                      className,
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm',
                        item.read ? 'text-slate-600' : 'font-medium text-slate-900',
                      )}
                    >
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {!item.read && (
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                  )}
                </>
              )
              return (
                <li key={item.id} className="border-b border-slate-100 last:border-0">
                  {item.href ? (
                    <Link
                      to={item.href}
                      onClick={() => {
                        setReadIds((current) => new Set(current).add(item.id))
                        setOpen(false)
                      }}
                      className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-slate-50"
                    >
                      {content}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-2.5 px-3 py-2.5">{content}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
