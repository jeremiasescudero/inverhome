import { Link } from 'react-router-dom'
import { Button, DescriptionList, Drawer, ErrorState, LoadingState, StatusBadge } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDateLong, formatMoney, fullName } from '@/lib/format'
import { visitOutcomeLabels, visitStatusMeta } from '@/lib/labels'
import { visitsService } from '@/services'
import type { VisitStatus } from '@/types'

export interface VisitDrawerProps {
  visitId: string | undefined
  onClose: () => void
  onChangeStatus?: (id: string, status: VisitStatus) => void
}

/** Transitions a visit can take from each state; terminal states offer none. */
const NEXT_STATUSES: Record<VisitStatus, VisitStatus[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['done', 'no_show', 'cancelled'],
  done: [],
  cancelled: ['scheduled'],
  no_show: ['scheduled'],
}

export function VisitDrawer({ visitId, onClose, onChangeStatus }: VisitDrawerProps) {
  const detail = useAsync(
    () => (visitId ? visitsService.getById(visitId) : Promise.resolve(undefined)),
    [visitId],
  )
  const visit = detail.data?.visit
  const transitions = visit ? NEXT_STATUSES[visit.status] : []

  return (
    <Drawer
      open={Boolean(visitId)}
      onClose={onClose}
      title={visit ? `${visit.code} · ${formatDateLong(visit.date)} ${visit.time}` : 'Visita'}
      description={detail.data?.property?.title}
      footer={
        onChangeStatus &&
        visit &&
        transitions.length > 0 && (
          <>
            {transitions.map((status) => (
              <Button
                key={status}
                size="sm"
                variant={status === 'done' || status === 'confirmed' ? 'primary' : 'secondary'}
                onClick={() => onChangeStatus(visit.id, status)}
              >
                {visitStatusMeta[status].label}
              </Button>
            ))}
          </>
        )
      }
    >
      {detail.loading && <LoadingState rows={5} className="px-0" />}
      {detail.error && <ErrorState description={detail.error.message} onRetry={detail.reload} />}
      {detail.data && visit && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <StatusBadge meta={visitStatusMeta[visit.status]} />
            {visit.outcome && (
              <span className="text-xs text-slate-600">Resultado: {visitOutcomeLabels[visit.outcome]}</span>
            )}
          </div>

          <DescriptionList
            columns={2}
            items={[
              {
                label: 'Propiedad',
                wide: true,
                value: detail.data.property ? (
                  <Link to={`/propiedades/${detail.data.property.id}`} className="text-brand-700 hover:underline">
                    {detail.data.property.code} — {detail.data.property.title}
                  </Link>
                ) : (
                  '—'
                ),
              },
              {
                label: 'Precio',
                value: detail.data.property ? formatMoney(detail.data.property.price) : '—',
              },
              {
                label: 'Cliente',
                value: detail.data.person ? (
                  <Link to={`/clientes/${detail.data.person.id}`} className="text-brand-700 hover:underline">
                    {fullName(detail.data.person)}
                  </Link>
                ) : (
                  '—'
                ),
              },
              { label: 'Teléfono', value: detail.data.person?.phone ?? '—' },
              { label: 'Agente', value: detail.data.agent?.name ?? 'Sin asignar' },
              {
                label: 'Lead de origen',
                value: visit.leadId ? (
                  <Link to={`/leads/${visit.leadId}`} className="text-brand-700 hover:underline">
                    {visit.leadId}
                  </Link>
                ) : (
                  '—'
                ),
              },
              { label: 'Comentarios', value: visit.comments || '—', wide: true },
            ]}
          />

          {onChangeStatus && transitions.length === 0 && (
            <p className="text-xs text-slate-500">
              La visita está en un estado final; no admite más cambios.
            </p>
          )}
        </div>
      )}
    </Drawer>
  )
}
