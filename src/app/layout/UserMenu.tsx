import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/cn'
import { userRoleLabels } from '@/lib/labels'
import { resetDb } from '@/mocks/db'

/**
 * Current demo user plus the impersonation picker. Switching users is how a
 * reviewer sees what each role can and cannot access; it is not authentication.
 */
export function UserMenu() {
  const { user, users, impersonate } = useSession()
  const { notify } = useToast()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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

  function switchTo(userId: string) {
    impersonate(userId)
    setOpen(false)
    navigate('/dashboard')
  }

  function reset() {
    resetDb()
    setOpen(false)
    notify({ title: 'Datos de la demo restablecidos', tone: 'info' })
    navigate('/dashboard')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-md px-1.5 hover:bg-slate-100"
      >
        <Avatar name={user.name} color={user.avatarColor} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-medium text-slate-900">{user.name}</span>
          <span className="block text-2xs text-slate-500">{userRoleLabels[user.role]}</span>
        </span>
        <ChevronDown className="size-3.5 text-slate-400" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Usuario"
          className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          <p className="border-b border-slate-200 px-3 py-2 text-2xs font-semibold tracking-wide text-slate-500 uppercase">
            Ver la demo como
          </p>
          <ul>
            {users.map((candidate) => {
              const isCurrent = candidate.id === user.id
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    onClick={() => switchTo(candidate.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50',
                      isCurrent && 'bg-brand-50/60',
                    )}
                  >
                    <Avatar name={candidate.name} color={candidate.avatarColor} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-slate-900">{candidate.name}</span>
                      <span className="block text-2xs text-slate-500">
                        {userRoleLabels[candidate.role]}
                      </span>
                    </span>
                    {isCurrent && <Check className="size-3.5 text-brand-700" aria-hidden="true" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            role="menuitem"
            onClick={reset}
            className="flex w-full items-center gap-2 border-t border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restablecer datos de la demo
          </button>
        </div>
      )}
    </div>
  )
}
