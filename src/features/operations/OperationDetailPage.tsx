import { ArrowRight, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmDialog,
  DescriptionList,
  EmptyState,
  ErrorState,
  FileCard,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
  Stepper,
  Timeline,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatMoney, formatPercent } from '@/lib/format'
import {
  operationPartyRoleLabels,
  operationStatusMeta,
  operationStatusOrder,
  operationTypeLabels,
} from '@/lib/labels'
import { auditService, operationsService, usersService } from '@/services'
import type { ActivityEntry, OperationStatus } from '@/types'

export function OperationDetailPage() {
  const { id = '' } = useParams()
  const { user, can } = useSession()
  const { notify } = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const detail = useAsync(() => operationsService.getById(id), [id])
  const audit = useAsync(() => auditService.forEntity(id), [id, detail.data?.operation.status])
  const users = useAsync(() => usersService.all(), [])

  async function changeStatus(status: OperationStatus) {
    setConfirmCancel(false)
    try {
      await operationsService.changeStatus(id, status, user.id)
      notify({ title: 'Operación actualizada', description: `Nuevo estado: ${operationStatusMeta[status].label}.` })
      detail.reload()
    } catch (cause) {
      notify({ title: 'No se pudo actualizar la operación', description: (cause as Error).message, tone: 'error' })
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

  const { operation, property, agent, parties, documents, rental, net } = detail.data
  const isCancelled = operation.status === 'cancelled'
  const currentIndex = operationStatusOrder.indexOf(operation.status)
  const nextStatus = !isCancelled ? operationStatusOrder[currentIndex + 1] : undefined
  const canManage = can('operations.manage')

  const activity: ActivityEntry[] = (audit.data ?? []).map((event) => ({
    id: event.id,
    at: event.at,
    userId: event.userId,
    title: event.summary,
    description: event.changes?.map((change) => `${change.field}: ${change.before} → ${change.after}`).join(' · '),
    icon: event.action === 'document_upload' ? 'document' : 'operation',
  }))

  const resolveUserName = (userId: string) =>
    users.data?.find((candidate) => candidate.id === userId)?.name ?? userId

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Operaciones', to: '/operaciones' }, { label: operation.code }]}
        title={`${operation.code} · ${operationTypeLabels[operation.type]}`}
        description={property ? `${property.code} — ${property.title}` : undefined}
        meta={
          <>
            <StatusBadge meta={operationStatusMeta[operation.status]} />
            <Badge>Iniciada {formatDate(operation.startedAt)}</Badge>
            {operation.closedAt && <Badge tone="positive">Cerrada {formatDate(operation.closedAt)}</Badge>}
          </>
        }
        actions={
          canManage &&
          !isCancelled &&
          operation.status !== 'closed' && (
            <>
              <Button
                variant="danger"
                onClick={() => setConfirmCancel(true)}
                icon={<XCircle className="size-4" aria-hidden="true" />}
              >
                Cancelar operación
              </Button>
              {nextStatus && (
                <Button
                  variant="primary"
                  onClick={() => changeStatus(nextStatus)}
                  icon={<ArrowRight className="size-4" aria-hidden="true" />}
                >
                  Avanzar a {operationStatusMeta[nextStatus].label}
                </Button>
              )}
            </>
          )
        }
      />

      <Card>
        <CardHeader title="Progreso" description="Etapas del proceso comercial." />
        <CardBody>
          <Stepper
            steps={operationStatusOrder.map((status) => ({ id: status, label: operationStatusMeta[status].label }))}
            currentIndex={currentIndex}
            cancelled={isCancelled}
          />
          {isCancelled && (
            <p className="mt-3 text-xs text-rose-700">Esta operación fue cancelada y no admite más cambios.</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader title="Condiciones económicas" />
            <CardBody>
              <DescriptionList
                columns={3}
                items={[
                  {
                    label: operation.type === 'sale' ? 'Precio de venta' : 'Alquiler mensual',
                    value: <span className="text-base font-semibold tabular-nums">{formatMoney(operation.price)}</span>,
                  },
                  {
                    label: operation.type === 'sale' ? 'Reserva' : 'Depósito',
                    value: formatMoney(operation.reservation),
                  },
                  ...(operation.downPayment ? [{ label: 'Seña', value: formatMoney(operation.downPayment) }] : []),
                  {
                    label: `Comisión (${formatPercent(operation.commissionRate)})`,
                    value: formatMoney(operation.commission),
                  },
                  { label: 'Gastos', value: formatMoney(operation.expenses) },
                  {
                    label: 'Resultado neto',
                    value: <span className="font-medium text-emerald-800 tabular-nums">{formatMoney(net)}</span>,
                  },
                  ...(operation.notes ? [{ label: 'Notas', value: operation.notes, wide: true }] : []),
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Documentación" description={`${documents.length} documentos asociados`} />
            <CardBody>
              {documents.length === 0 ? (
                <EmptyState title="Sin documentación" description="Reserva, boleto y contrato van a aparecer acá." />
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <FileCard document={document} uploadedByName={resolveUserName(document.uploadedById)} />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Historial" description="Cambios registrados en auditoría para esta operación." />
            <CardBody>
              {audit.loading && <LoadingState rows={3} className="px-0" />}
              {audit.data && <Timeline entries={activity} resolveUserName={resolveUserName} emptyTitle="Sin cambios registrados" />}
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Partes" />
            <CardBody className="px-0 py-0">
              <ul className="divide-y divide-slate-100">
                {parties.map((party) => (
                  <li key={`${party.personId}-${party.role}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <span className="text-2xs font-medium tracking-wide text-slate-500 uppercase">
                      {operationPartyRoleLabels[party.role]}
                    </span>
                    <Link to={`/clientes/${party.personId}`} className="text-sm text-brand-700 hover:underline">
                      {party.name}
                    </Link>
                  </li>
                ))}
                <li className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="text-2xs font-medium tracking-wide text-slate-500 uppercase">Agente</span>
                  <span className="text-sm text-slate-800">{agent?.name ?? 'Sin asignar'}</span>
                </li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Propiedad" />
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
                    { label: 'Barrio', value: property.location.neighborhood },
                    { label: 'Precio publicado', value: formatMoney(property.price) },
                  ]}
                />
              ) : (
                <p className="text-sm text-slate-500">Propiedad no disponible.</p>
              )}
            </CardBody>
          </Card>

          {rental && (
            <Card>
              <CardHeader title="Contrato generado" />
              <CardBody>
                <Link to={`/alquileres/${rental.id}`} className="text-sm text-brand-700 hover:underline">
                  {rental.code} · {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancelar operación"
        message={`¿Confirmás la cancelación de ${operation.code}? El cambio queda registrado en auditoría.`}
        confirmLabel="Cancelar operación"
        cancelLabel="Volver"
        tone="danger"
        onConfirm={() => changeStatus('cancelled')}
        onCancel={() => setConfirmCancel(false)}
      />
    </PageContainer>
  )
}
