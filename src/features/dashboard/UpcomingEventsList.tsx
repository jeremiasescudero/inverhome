import { Banknote, CalendarDays, FileSignature, ListChecks, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui'
import { formatRelativeDate } from '@/lib/format'
import { DEMO_TODAY } from '@/mocks/db'
import type { UpcomingEvent } from '@/types'

const KIND_ICON: Record<UpcomingEvent['kind'], typeof CalendarDays> = {
  visit: CalendarDays,
  payment: Banknote,
  contract: FileSignature,
  adjustment: TrendingUp,
  task: ListChecks,
}

const KIND_LABEL: Record<UpcomingEvent['kind'], string> = {
  visit: 'Visita',
  payment: 'Pago',
  contract: 'Contrato',
  adjustment: 'Actualización',
  task: 'Tarea',
}

export function UpcomingEventsList({ events }: { events: UpcomingEvent[] }) {
  if (events.length === 0) {
    return <EmptyState title="Sin eventos próximos" />
  }

  return (
    <ul className="divide-y divide-slate-100">
      {events.map((event) => {
        const Icon = KIND_ICON[event.kind]
        const content = (
          <>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <Icon className="size-4" aria-hidden="true" />
              <span className="sr-only">{KIND_LABEL[event.kind]}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 block text-sm text-slate-900">{event.title}</span>
              {event.description && (
                <span className="line-clamp-1 block text-xs text-slate-500">{event.description}</span>
              )}
            </span>
            <span className="shrink-0 text-2xs font-medium text-slate-500">
              {formatRelativeDate(event.at, new Date(DEMO_TODAY))}
            </span>
          </>
        )
        return (
          <li key={event.id}>
            {event.href ? (
              <Link to={event.href} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
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
