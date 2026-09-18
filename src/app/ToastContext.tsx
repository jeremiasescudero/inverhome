import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

export type ToastTone = 'success' | 'info' | 'error'

export interface ToastInput {
  title: string
  description?: string
  tone?: ToastTone
}

interface Toast extends ToastInput {
  id: number
}

interface ToastValue {
  notify: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastValue | undefined>(undefined)

const TONE_STYLES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-emerald-600' },
  info: { icon: Info, className: 'text-sky-600' },
  error: { icon: AlertTriangle, className: 'text-rose-600' },
}

const DISMISS_MS = 4000

/**
 * Lightweight feedback for mock mutations ("Propiedad creada", "Pago
 * registrado"). Every write in the demo confirms itself through here so the
 * user can tell that the action actually happened.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback(
    (input: ToastInput) => {
      counter.current += 1
      const id = counter.current
      setToasts((current) => [...current, { id, tone: 'success', ...input }])
      setTimeout(() => dismiss(id), DISMISS_MS)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = TONE_STYLES[toast.tone ?? 'success']
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-3 shadow-lg"
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', className)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs text-slate-500">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Cerrar notificación"
                className="rounded p-0.5 text-slate-400 hover:text-slate-700"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
