import { Clock, MapPin } from 'lucide-react'
import { Avatar, EmptyState, ErrorState, LoadingState, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatDateLong, formatRelativeDate } from '@/lib/format'
import { visitStatusMeta } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import type { VisitDay } from '@/services'

export interface VisitAgendaProps {
  days: VisitDay[] | undefined
  loading: boolean
  error?: Error
  onRetry: () => void
  onSelect: (id: string) => void
}

function weekday(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long' })
}

/** Visits grouped by day from the demo's reference date onwards. */
export function VisitAgenda({ days, loading, error, onRetry, onSelect }: VisitAgendaProps) {
  if (error) return <ErrorState description={error.message} onRetry={onRetry} />
  if (loading && !days) return <LoadingState rows={4} />
  if (!days) return null
  if (days.length === 0) {
    return (
      <EmptyState
        title="No hay visitas agendadas"
        description="Las próximas visitas van a aparecer agrupadas por día."
      />
    )
  }

  return (
    <div className="divide-y divide-slate-200">
      {days.map((day) => {
        const isToday = day.date === DEMO_TODAY
        return (
          <section key={day.date} className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[11rem_1fr]">
            <header>
              <p className="text-2xs font-semibold tracking-wide text-slate-500 uppercase">
                {formatRelativeDate(day.date, new Date(DEMO_TODAY))}
              </p>
              <p className={cn('text-sm font-medium capitalize', isToday ? 'text-brand-700' : 'text-slate-900')}>
                {weekday(day.date)}
              </p>
              <p className="text-xs text-slate-500">{formatDateLong(day.date)}</p>
              <p className="mt-1 text-xs text-slate-500">
                {day.items.length} {day.items.length === 1 ? 'visita' : 'visitas'}
              </p>
            </header>
            <ol className="flex flex-col gap-2">
              {day.items.map((visit) => (
                <li key={visit.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(visit.id)}
                    className="flex w-full flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    <span className="flex w-14 items-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
                      <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
                      {visit.time}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{visit.propertyTitle}</span>
                      <span className="flex items-center gap-1 truncate text-xs text-slate-500">
                        <MapPin className="size-3" aria-hidden="true" />
                        {visit.propertyAddress}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <Avatar name={visit.personName} color="bg-slate-500" />
                      {visit.personName}
                    </span>
                    <span className="hidden text-xs text-slate-500 lg:block">Agente: {visit.agentName}</span>
                    <StatusBadge meta={visitStatusMeta[visit.status]} />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
