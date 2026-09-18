import { ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ButtonLink, DescriptionList, Drawer, ErrorState, LoadingState, StatusBadge } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatRelativeDate, fullName } from '@/lib/format'
import { leadPriorityMeta, leadSourceLabels, leadStageMeta, leadStageOrder, visitStatusMeta } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import { leadsService } from '@/services'
import type { LeadStage } from '@/types'
import { StageSelect } from './StageSelect'

export interface LeadDrawerProps {
  leadId: string | undefined
  onClose: () => void
  onMove?: (id: string, stage: LeadStage) => void
}

/** Quick view over the board/list; the full page lives at /leads/:id. */
export function LeadDrawer({ leadId, onClose, onMove }: LeadDrawerProps) {
  const detail = useAsync(
    () => (leadId ? leadsService.getById(leadId) : Promise.resolve(undefined)),
    [leadId],
  )

  const lead = detail.data?.lead

  return (
    <Drawer
      open={Boolean(leadId)}
      onClose={onClose}
      title={lead ? `${lead.code} · ${detail.data?.person ? fullName(detail.data.person) : ''}` : 'Lead'}
      description={lead ? leadStageMeta[lead.stage].label : undefined}
      footer={
        lead && (
          <ButtonLink to={`/leads/${lead.id}`} icon={<ExternalLink className="size-3.5" aria-hidden="true" />}>
            Abrir ficha completa
          </ButtonLink>
        )
      }
    >
      {detail.loading && <LoadingState rows={5} className="px-0" />}
      {detail.error && <ErrorState description={detail.error.message} onRetry={detail.reload} />}
      {detail.data && lead && (
        <div className="flex flex-col gap-5">
          {onMove && (
            <StageSelect
              value={lead.stage}
              stages={leadStageOrder}
              onChange={(stage) => onMove(lead.id, stage)}
            />
          )}

          <DescriptionList
            columns={2}
            items={[
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
              {
                label: 'Propiedad de interés',
                wide: true,
                value: detail.data.property ? (
                  <Link to={`/propiedades/${detail.data.property.id}`} className="text-brand-700 hover:underline">
                    {detail.data.property.code} — {detail.data.property.title}
                  </Link>
                ) : (
                  'Consulta general'
                ),
              },
              { label: 'Origen', value: leadSourceLabels[lead.source] },
              { label: 'Prioridad', value: <StatusBadge meta={leadPriorityMeta[lead.priority]} showIcon={false} /> },
              { label: 'Agente', value: detail.data.agent?.name ?? 'Sin asignar' },
              { label: 'Alta', value: formatDate(lead.createdAt) },
              {
                label: 'Próximo contacto',
                value: lead.nextContactAt
                  ? formatRelativeDate(lead.nextContactAt, new Date(DEMO_TODAY))
                  : 'Sin agendar',
              },
              { label: 'Notas', value: lead.notes || '—', wide: true },
            ]}
          />

          <section>
            <h3 className="mb-2 text-2xs font-medium tracking-wide text-slate-500 uppercase">
              Visitas vinculadas
            </h3>
            {detail.data.visits.length === 0 ? (
              <p className="text-xs text-slate-500">Sin visitas registradas para este lead.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                {detail.data.visits.map((visit) => (
                  <li key={visit.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="tabular-nums text-slate-800">
                      {formatDate(visit.date)} {visit.time}
                    </span>
                    <StatusBadge meta={visitStatusMeta[visit.status]} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  )
}
