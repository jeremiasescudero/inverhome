import { Mail, Pencil, Phone } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import {
  Avatar,
  Badge,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  EmptyState,
  ErrorState,
  FileCard,
  ImagePlaceholder,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
  Tabs,
  Timeline,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatArea, formatDate, formatMoney, formatNumber, fullName } from '@/lib/format'
import {
  operationKindLabels,
  operationStatusMeta,
  operationTypeLabels,
  propertyStatusMeta,
  propertyTypeLabels,
  userRoleLabels,
} from '@/lib/labels'
import { propertiesService, usersService } from '@/services'

type TabId = 'activity' | 'documents' | 'operations'

export function PropertyDetailPage() {
  const { id = '' } = useParams()
  const { canEditProperty } = useSession()
  const [tab, setTab] = useState<TabId>('activity')
  const detail = useAsync(() => propertiesService.getById(id), [id])
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

  const { property, address, owner, agent, documents, operations, activity } = detail.data
  const { features } = property

  const resolveUserName = (userId: string) =>
    users.data?.find((candidate) => candidate.id === userId)?.name ?? userId

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Propiedades', to: '/propiedades' }, { label: property.code }]}
        title={property.title}
        description={address}
        meta={
          <>
            <StatusBadge meta={propertyStatusMeta[property.status]} />
            <Badge>{operationKindLabels[property.operation]}</Badge>
            <Badge>{propertyTypeLabels[property.type]}</Badge>
            {!property.published && <Badge tone="attention">Sin publicar</Badge>}
          </>
        }
        actions={
          canEditProperty(property.agentId) && (
            <ButtonLink
              to={`/propiedades/${property.id}/editar`}
              icon={<Pencil className="size-4" aria-hidden="true" />}
            >
              Editar
            </ButtonLink>
          )
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader title="Galería" description={`${property.images.length} imágenes de referencia`} />
            <CardBody>
              {property.images.length === 0 ? (
                <ImagePlaceholder className="h-40 w-full rounded-md" />
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {property.images.map((caption, index) => (
                    <ImagePlaceholder
                      key={caption}
                      caption={caption}
                      seed={`${property.id}-${caption}`}
                      className={index === 0 ? 'col-span-2 h-48 rounded-md sm:row-span-2 sm:h-full' : 'h-24 rounded-md'}
                    />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Información general" />
            <CardBody>
              <DescriptionList
                columns={3}
                items={[
                  {
                    label: 'Precio',
                    value: (
                      <span className="text-base font-semibold tabular-nums">
                        {formatMoney(property.price)}
                      </span>
                    ),
                  },
                  ...(property.rentPrice
                    ? [{ label: 'Alquiler mensual', value: formatMoney(property.rentPrice) }]
                    : []),
                  { label: 'Código', value: property.code },
                  { label: 'Barrio', value: property.location.neighborhood },
                  { label: 'Ciudad', value: `${property.location.city}, ${property.location.province}` },
                  { label: 'Alta', value: formatDate(property.createdAt) },
                  { label: 'Última actualización', value: formatDate(property.updatedAt) },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Características" />
            <CardBody>
              <DescriptionList
                columns={4}
                items={[
                  { label: 'Superficie total', value: formatArea(features.totalArea) },
                  { label: 'Superficie cubierta', value: formatArea(features.coveredArea) },
                  { label: 'Ambientes', value: formatNumber(features.rooms) },
                  { label: 'Dormitorios', value: formatNumber(features.bedrooms) },
                  { label: 'Baños', value: formatNumber(features.bathrooms) },
                  { label: 'Cochera', value: features.garage > 0 ? `${features.garage}` : 'No' },
                  { label: 'Antigüedad', value: features.ageYears === 0 ? 'A estrenar' : `${features.ageYears} años` },
                  {
                    label: 'Expensas',
                    value: features.expenses
                      ? formatMoney({ amount: features.expenses, currency: 'ARS' })
                      : '—',
                  },
                  {
                    label: 'Comodidades',
                    wide: true,
                    value:
                      features.amenities.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {features.amenities.map((amenity) => (
                            <Badge key={amenity}>{amenity}</Badge>
                          ))}
                        </span>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Descripción comercial" />
            <CardBody>
              <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">
                {property.description}
              </p>
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Propietario" />
            <CardBody>
              {owner ? (
                <ContactBlock
                  name={fullName(owner)}
                  subtitle={`${owner.documentType} ${owner.documentNumber}`}
                  phone={owner.phone}
                  email={owner.email}
                  href={`/clientes/${owner.id}`}
                  color="bg-slate-500"
                />
              ) : (
                <p className="text-sm text-slate-500">Sin propietario asignado.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Agente responsable" />
            <CardBody>
              {agent ? (
                <ContactBlock
                  name={agent.name}
                  subtitle={userRoleLabels[agent.role]}
                  phone={agent.phone}
                  email={agent.email}
                  color={agent.avatarColor}
                />
              ) : (
                <p className="text-sm text-slate-500">Sin agente asignado.</p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <Card>
        <Tabs
          className="px-4"
          active={tab}
          onChange={(next) => setTab(next as TabId)}
          items={[
            { id: 'activity', label: 'Actividad', count: activity.length },
            { id: 'documents', label: 'Documentación', count: documents.length },
            { id: 'operations', label: 'Operaciones', count: operations.length },
          ]}
        />
        <CardBody>
          {tab === 'activity' && <Timeline entries={activity} resolveUserName={resolveUserName} />}

          {tab === 'documents' &&
            (documents.length === 0 ? (
              <EmptyState
                title="Sin documentación asociada"
                description="Los documentos de la propiedad (escritura, planos, impuestos) van a aparecer acá."
              />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((document) => (
                  <li key={document.id}>
                    <FileCard document={document} uploadedByName={resolveUserName(document.uploadedById)} />
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'operations' &&
            (operations.length === 0 ? (
              <EmptyState
                title="Sin operaciones"
                description="Todavía no se iniciaron operaciones de venta o alquiler sobre esta propiedad."
              />
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
                      <span className="text-xs text-slate-500">{formatDate(operation.startedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </CardBody>
      </Card>
    </PageContainer>
  )
}

function ContactBlock({
  name,
  subtitle,
  phone,
  email,
  href,
  color,
}: {
  name: string
  subtitle: string
  phone?: string
  email?: string
  href?: string
  color: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar name={name} color={color} size="md" />
        <div className="min-w-0">
          {href ? (
            <Link to={href} className="block truncate text-sm font-medium text-slate-900 hover:text-brand-700 hover:underline">
              {name}
            </Link>
          ) : (
            <p className="truncate text-sm font-medium text-slate-900">{name}</p>
          )}
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ul className="space-y-1 text-sm text-slate-700">
        {phone && (
          <li className="flex items-center gap-2">
            <Phone className="size-3.5 text-slate-400" aria-hidden="true" />
            <span>{phone}</span>
          </li>
        )}
        {email && (
          <li className="flex items-center gap-2">
            <Mail className="size-3.5 text-slate-400" aria-hidden="true" />
            <span className="truncate">{email}</span>
          </li>
        )}
      </ul>
    </div>
  )
}
