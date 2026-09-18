import { AlertTriangle, ChevronRight, Clock, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { Alert, AlertSeverity } from '@/types'

const SEVERITY: Record<AlertSeverity, { icon: typeof Info; className: string; label: string }> = {
  critical: { icon: AlertTriangle, className: 'bg-rose-50 text-rose-700', label: 'Crítico' },
  attention: { icon: Clock, className: 'bg-amber-50 text-amber-800', label: 'Atención' },
  info: { icon: Info, className: 'bg-sky-50 text-sky-700', label: 'Info' },
}

export function AlertsList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return (
      <EmptyState
        title="Todo en orden"
        description="No hay contratos, pagos ni documentación que requieran atención."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {alerts.map((alert) => {
        const { icon: Icon, className, label } = SEVERITY[alert.severity]
        const content = (
          <>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-md', className)}>
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-900">{alert.title}</span>
              <span className="mt-0.5 line-clamp-1 block text-xs text-slate-500">
                {alert.description}
              </span>
            </span>
            {alert.href && <ChevronRight className="size-4 shrink-0 text-slate-300" aria-hidden="true" />}
          </>
        )
        return (
          <li key={alert.id}>
            {alert.href ? (
              <Link to={alert.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-4 py-2.5">{content}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
