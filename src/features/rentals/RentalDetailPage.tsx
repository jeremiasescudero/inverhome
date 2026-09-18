import { Banknote } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  DescriptionList,
  EmptyState,
  ErrorState,
  FileCard,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
  Tabs,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { daysFromToday, formatDate, formatMoney, formatPercent, formatPeriod } from '@/lib/format'
import { paymentMethodLabels, paymentStatusMeta, rentalStatusMeta } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import { rentalsService, usersService } from '@/services'
import type { Payment, Settlement } from '@/types'
import { RegisterPaymentModal, type RegisterPaymentTarget } from '@/features/payments/RegisterPaymentModal'

type TabId = 'payments' | 'settlements' | 'documents'

const SETTLEMENT_META = {
  pending: { label: 'Pendiente', tone: 'attention' as const },
  paid: { label: 'Liquidada', tone: 'positive' as const },
}

export function RentalDetailPage() {
  const { id = '' } = useParams()
  const { can } = useSession()
  const [tab, setTab] = useState<TabId>('payments')
  const [target, setTarget] = useState<RegisterPaymentTarget | undefined>()
  const detail = useAsync(() => rentalsService.getById(id), [id])
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

  const { rental, property, ownerName, tenantName, guarantorNames, agent, payments, settlements, documents, managementFee } =
    detail.data
  const remaining = daysFromToday(rental.endDate, new Date(DEMO_TODAY))
  const canManagePayments = can('payments.manage')

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'period',
      header: 'Período',
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-slate-900 capitalize">{formatPeriod(row.period)}</span>
          <span className="text-xs text-slate-500">{row.code}</span>
        </span>
      ),
    },
    { key: 'amount', header: 'Monto', align: 'right', render: (row) => <span className="tabular-nums">{formatMoney(row.amount)}</span> },
    { key: 'due', header: 'Vencimiento', hideBelow: 'md', render: (row) => formatDate(row.dueDate) },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={paymentStatusMeta[row.status]} /> },
    {
      key: 'paid',
      header: 'Pago',
      hideBelow: 'lg',
      render: (row) =>
        row.paidAt ? (
          <span className="text-xs text-slate-600">
            {formatDate(row.paidAt)} · {row.method ? paymentMethodLabels[row.method] : ''}
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    ...(canManagePayments
      ? [
          {
            key: 'actions',
            header: '',
            align: 'right' as const,
            render: (row: Payment) =>
              row.status !== 'paid' ? (
                <Button
                  size="sm"
                  onClick={() => setTarget({ ...row, tenantName })}
                  icon={<Banknote className="size-3.5" aria-hidden="true" />}
                >
                  Registrar
                </Button>
              ) : null,
          },
        ]
      : []),
  ]

  const settlementColumns: Column<Settlement>[] = [
    { key: 'code', header: 'Liquidación', render: (row) => <span className="font-medium text-slate-900">{row.code}</span> },
    { key: 'period', header: 'Período', render: (row) => <span className="capitalize">{formatPeriod(row.period)}</span> },
    { key: 'total', header: 'A liquidar', align: 'right', render: (row) => <span className="font-medium tabular-nums">{formatMoney(row.total)}</span> },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={SETTLEMENT_META[row.status]} /> },
  ]

  const resolveUserName = (userId: string) =>
    users.data?.find((candidate) => candidate.id === userId)?.name ?? userId

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Alquileres', to: '/alquileres' }, { label: rental.code }]}
        title={`Contrato ${rental.code}`}
        description={property ? `${property.code} — ${property.title}` : undefined}
        meta={
          <>
            <StatusBadge meta={rentalStatusMeta[rental.status]} />
            <Badge tone={remaining <= 60 && remaining >= 0 ? 'attention' : 'neutral'}>
              {remaining < 0 ? `Venció hace ${Math.abs(remaining)} días` : `Vence en ${remaining} días`}
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Condiciones del contrato" />
          <CardBody>
            <DescriptionList
              columns={4}
              items={[
                {
                  label: 'Alquiler mensual',
                  value: <span className="text-base font-semibold tabular-nums">{formatMoney(rental.monthlyAmount)}</span>,
                },
                { label: 'Depósito', value: formatMoney(rental.deposit) },
                {
                  label: `Honorarios (${formatPercent(rental.managementFeeRate)})`,
                  value: `${formatMoney(managementFee)} / mes`,
                },
                { label: 'Agente', value: agent?.name ?? 'Sin asignar' },
                { label: 'Inicio', value: formatDate(rental.startDate) },
                { label: 'Vencimiento', value: formatDate(rental.endDate) },
                { label: 'Próxima actualización', value: formatDate(rental.nextAdjustmentDate) },
                { label: 'Frecuencia de ajuste', value: `Cada ${rental.adjustmentPeriodMonths} meses` },
              ]}
            />
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title="Partes" />
          <CardBody>
            <DescriptionList
              columns={2}
              items={[
                {
                  label: 'Propietario',
                  wide: true,
                  value: (
                    <Link to={`/clientes/${rental.ownerId}`} className="text-brand-700 hover:underline">
                      {ownerName}
                    </Link>
                  ),
                },
                {
                  label: 'Inquilino',
                  wide: true,
                  value: (
                    <Link to={`/clientes/${rental.tenantId}`} className="text-brand-700 hover:underline">
                      {tenantName}
                    </Link>
                  ),
                },
                {
                  label: 'Garantes',
                  wide: true,
                  value:
                    guarantorNames.length === 0 ? (
                      '—'
                    ) : (
                      <ul className="space-y-0.5">
                        {rental.guarantorIds.map((guarantorId, index) => (
                          <li key={guarantorId}>
                            <Link to={`/clientes/${guarantorId}`} className="text-brand-700 hover:underline">
                              {guarantorNames[index]}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ),
                },
                ...(rental.operationId
                  ? [
                      {
                        label: 'Operación de origen',
                        wide: true,
                        value: (
                          <Link to={`/operaciones/${rental.operationId}`} className="text-brand-700 hover:underline">
                            {rental.operationId}
                          </Link>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <Tabs
          className="px-4"
          active={tab}
          onChange={(next) => setTab(next as TabId)}
          items={[
            { id: 'payments', label: 'Pagos', count: payments.length },
            { id: 'settlements', label: 'Liquidaciones', count: settlements.length },
            { id: 'documents', label: 'Documentación', count: documents.length },
          ]}
        />
        {tab === 'payments' && (
          <DataTable
            caption="Pagos del contrato"
            columns={paymentColumns}
            rows={payments}
            getRowId={(row) => row.id}
            emptyTitle="Sin pagos generados"
          />
        )}
        {tab === 'settlements' && (
          <DataTable
            caption="Liquidaciones del contrato"
            columns={settlementColumns}
            rows={settlements}
            getRowId={(row) => row.id}
            rowHref={(row) => `/finanzas/liquidaciones/${row.id}`}
            emptyTitle="Sin liquidaciones emitidas"
          />
        )}
        {tab === 'documents' && (
          <CardBody>
            {documents.length === 0 ? (
              <EmptyState title="Sin documentación" description="Contrato, garantías y recibos van a aparecer acá." />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((document) => (
                  <li key={document.id}>
                    <FileCard document={document} uploadedByName={resolveUserName(document.uploadedById)} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        )}
      </Card>

      <RegisterPaymentModal payment={target} onClose={() => setTarget(undefined)} onRegistered={detail.reload} />
    </PageContainer>
  )
}
