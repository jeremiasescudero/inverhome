import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatMoney, formatRelativeDate, fullName } from '@/lib/format'
import {
  leadPriorityMeta,
  leadSourceLabels,
  leadStageMeta,
  leadStageOrder,
  propertyStatusMeta,
  visitStatusMeta,
} from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import { leadsService } from '@/services'
import type { LeadStage } from '@/types'
import { StageSelect } from './StageSelect'

export function LeadDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useSession()
  const { notify } = useToast()
  const detail = useAsync(() => leadsService.getById(id), [id])

  async function move(stage: LeadStage) {
    try {
      await leadsService.changeStage(id, stage, user.id)
      notify({ title: 'Etapa actualizada', description: `Lead movido a ${leadStageMeta[stage].label}.` })
      detail.reload()
    } catch (cause) {
      notify({ title: 'No se pudo mover el lead', description: (cause as Error).message, tone: 'error' })
    }
  }

  if (detail.loading) {
    return (
      <PageContainer>
        <LoadingState rows={6} />
      </PageContainer>
    )
  }
  if (detail.error || !detail.data) {
    return (
      <PageContainer>
        <ErrorState description={detail.error?.message} onRetry={detail.reload} />
      </PageContainer>
    )
  }

  const { lead, person, property, agent, visits } = detail.data
  const personName = person ? fullName(person) : 'Sin cliente'

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Leads', to: '/leads' }, { label: lead.code }]}
        title={`${lead.code} · ${personName}`}
        description={property ? `Interés en ${property.title}` : 'Consulta general'}
        meta={
          <>
            <StatusBadge meta={leadStageMeta[lead.stage]} />
            <StatusBadge meta={leadPriorityMeta[lead.priority]} showIcon={false} />
            <Badge>{leadSourceLabels[lead.source]}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader title="Seguimiento" />
            <CardBody>
              <DescriptionList
                columns={3}
                items={[
                  { label: 'Agente', value: agent?.name ?? 'Sin asignar' },
                  { label: 'Fecha de alta', value: formatDate(lead.createdAt) },
                  {
                    label: 'Próximo contacto',
                    value: lead.nextContactAt ? (
                      formatRelativeDate(lead.nextContactAt, new Date(DEMO_TODAY))
                    ) : (
                      <span className="text-amber-800">Sin agendar</span>
                    ),
                  },
                  { label: 'Notas', value: lead.notes || '—', wide: true },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Visitas vinculadas" description="Visitas coordinadas a partir de este lead." />
            <CardBody className="px-0 py-0">
              {visits.length === 0 ? (
                <EmptyState
                  title="Sin visitas"
                  description="Todavía no se coordinó ninguna visita para este lead."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {visits.map((visit) => (
                    <li key={visit.id}>
                      <Link
                        to={`/visitas?visita=${visit.id}`}
                        className="flex flex-wrap items-center gap-3 px-4 py-2.5 hover:bg-slate-50"
                      >
                        <span className="font-medium tabular-nums text-slate-900">
                          {formatDate(visit.date)} {visit.time}
                        </span>
                        <StatusBadge meta={visitStatusMeta[visit.status]} />
                        <span className="ml-auto text-xs text-slate-500">{visit.comments}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          {can('leads.manage') && (
            <StageSelect value={lead.stage} stages={leadStageOrder} onChange={move} />
          )}

          <Card>
            <CardHeader title="Cliente" />
            <CardBody>
              {person ? (
                <DescriptionList
                  columns={2}
                  items={[
                    {
                      label: 'Nombre',
                      wide: true,
                      value: (
                        <Link to={`/clientes/${person.id}`} className="text-brand-700 hover:underline">
                          {personName}
                        </Link>
                      ),
                    },
                    { label: 'Teléfono', value: person.phone },
                    { label: 'Email', value: <span className="break-all">{person.email}</span> },
                  ]}
                />
              ) : (
                <p className="text-sm text-slate-500">Sin cliente asociado.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Propiedad de interés" />
            <CardBody>
              {property ? (
                <DescriptionList
                  columns={2}
                  items={[
                    {
                      label: 'Propiedad',
                      wide: true,
                      value: (
                        <Link to={`/propiedades/${property.id}`} className="text-brand-700 hover:underline">
                          {property.code} — {property.title}
                        </Link>
                      ),
                    },
                    { label: 'Precio', value: formatMoney(property.price) },
                    { label: 'Estado', value: <StatusBadge meta={propertyStatusMeta[property.status]} /> },
                  ]}
                />
              ) : (
                <p className="text-sm text-slate-500">Consulta general, sin propiedad puntual.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
