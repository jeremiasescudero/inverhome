import { Mail, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  ErrorState,
  FileCard,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
  Tabs,
  Timeline,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatMoney, fullName } from '@/lib/format'
import {
  leadStageMeta,
  operationStatusMeta,
  operationTypeLabels,
  personRoleLabels,
  propertyStatusMeta,
  visitStatusMeta,
} from '@/lib/labels'
import { clientsService, usersService } from '@/services'

type TabId = 'properties' | 'operations' | 'leads' | 'visits' | 'documents' | 'activity'

const RENTAL_ROLE: Record<'owner' | 'tenant' | 'guarantor', string> = {
  owner: 'Propietario',
  tenant: 'Inquilino',
  guarantor: 'Garante',
}

export function ClientDetailPage() {
  const { id = '' } = useParams()
  const [tab, setTab] = useState<TabId>('properties')
  const detail = useAsync(() => clientsService.getById(id), [id])
  const users = useAsync(() => usersService.all(), [])

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

  const { person, properties, operations, leads, visits, documents, rentals, activity } = detail.data
  const name = fullName(person)
  const resolveUserName = (userId: string) =>
    users.data?.find((candidate) => candidate.id === userId)?.name ?? userId

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Clientes', to: '/clientes' }, { label: name }]}
        title={name}
        description={`${person.documentType} ${person.documentNumber} · Cliente desde ${formatDate(person.createdAt)}`}
        meta={person.roles.map((role) => (
          <Badge key={role} tone="info">
            {personRoleLabels[role]}
          </Badge>
        ))}
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="self-start">
          <CardHeader title="Información personal" />
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={name} color="bg-slate-500" size="md" />
              <div>
                <p className="text-sm font-medium text-slate-900">{name}</p>
                <p className="text-xs text-slate-500">{person.id}</p>
              </div>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
                {person.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-3.5 text-slate-400" aria-hidden="true" />
                <span className="truncate">{person.email}</span>
              </li>
              {person.address && (
                <li className="flex items-center gap-2">
                  <MapPin className="size-3.5 text-slate-400" aria-hidden="true" />
                  {person.address}
                  {person.city && `, ${person.city}`}
                </li>
              )}
            </ul>
            {person.notes && (
              <DescriptionList columns={2} items={[{ label: 'Notas', value: person.notes, wide: true }]} />
            )}
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <Tabs
            className="px-4"
            active={tab}
            onChange={(next) => setTab(next as TabId)}
            items={[
              { id: 'properties', label: 'Propiedades', count: properties.length },
              { id: 'operations', label: 'Operaciones', count: operations.length + rentals.length },
              { id: 'leads', label: 'Leads', count: leads.length },
              { id: 'visits', label: 'Visitas', count: visits.length },
              { id: 'documents', label: 'Documentos', count: documents.length },
              { id: 'activity', label: 'Actividad', count: activity.length },
            ]}
          />
          <CardBody>
            {tab === 'properties' &&
              (properties.length === 0 ? (
                <EmptyState title="No es propietario de ninguna propiedad" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {properties.map((property) => (
                    <li key={property.id}>
                      <Link
                        to={`/propiedades/${property.id}`}
                        className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-slate-50"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-slate-900">{property.title}</span>
                          <span className="block text-xs text-slate-500">{property.code}</span>
                        </span>
                        <StatusBadge meta={propertyStatusMeta[property.status]} />
                        <span className="text-sm tabular-nums text-slate-700">
                          {formatMoney(property.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'operations' &&
              (operations.length === 0 && rentals.length === 0 ? (
                <EmptyState title="Sin operaciones ni contratos asociados" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {operations.map((operation) => (
                    <li key={operation.id}>
                      <Link
                        to={`/operaciones/${operation.id}`}
                        className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-900">{operation.code}</span>
                        <Badge>{operationTypeLabels[operation.type]}</Badge>
                        <StatusBadge meta={operationStatusMeta[operation.status]} />
                        <span className="ml-auto text-sm tabular-nums text-slate-700">
                          {formatMoney(operation.price)}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {rentals.map((rental) => (
                    <li key={rental.id}>
                      <Link
                        to={`/alquileres/${rental.id}`}
                        className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-slate-50"
                      >
                        <span className="font-medium text-slate-900">{rental.code}</span>
                        <Badge>Contrato de alquiler</Badge>
                        <Badge tone="info">{RENTAL_ROLE[rental.role]}</Badge>
                        <span className="ml-auto truncate text-xs text-slate-500">{rental.propertyLabel}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'leads' &&
              (leads.length === 0 ? (
                <EmptyState title="Sin leads registrados" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {leads.map((lead) => (
                    <li key={lead.id}>
                      <Link to={`/leads/${lead.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-slate-50">
                        <span className="font-medium text-slate-900">{lead.code}</span>
                        <StatusBadge meta={leadStageMeta[lead.stage]} />
                        <span className="ml-auto text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'visits' &&
              (visits.length === 0 ? (
                <EmptyState title="Sin visitas registradas" />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {visits.map((visit) => (
                    <li key={visit.id}>
                      <Link to={`/visitas?visita=${visit.id}`} className="flex flex-wrap items-center gap-3 py-2.5 hover:bg-slate-50">
                        <span className="font-medium tabular-nums text-slate-900">
                          {formatDate(visit.date)} {visit.time}
                        </span>
                        <StatusBadge meta={visitStatusMeta[visit.status]} />
                        <span className="ml-auto truncate text-xs text-slate-500">{visit.comments}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'documents' &&
              (documents.length === 0 ? (
                <EmptyState title="Sin documentación cargada" />
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <FileCard document={document} uploadedByName={resolveUserName(document.uploadedById)} />
                    </li>
                  ))}
                </ul>
              ))}

            {tab === 'activity' && <Timeline entries={activity} resolveUserName={resolveUserName} />}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
