import { Link, useParams } from 'react-router-dom'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DescriptionList,
  ErrorState,
  LoadingState,
  PageContainer,
  PageHeader,
  StatusBadge,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { cn } from '@/lib/cn'
import { formatDate, formatMoney, formatPeriod } from '@/lib/format'
import { paymentsService } from '@/services'

const STATUS_META = {
  pending: { label: 'Pendiente de pago', tone: 'attention' as const },
  paid: { label: 'Liquidada', tone: 'positive' as const },
}

/** Owner statement: what was collected, what the agency keeps, what is handed over. */
export function SettlementDetailPage() {
  const { id = '' } = useParams()
  const detail = useAsync(() => paymentsService.getSettlement(id), [id])

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

  const { settlement, ownerName, propertyLabel, rentalCode } = detail.data
  const credits = settlement.lines.filter((line) => line.kind === 'credit')
  const debits = settlement.lines.filter((line) => line.kind === 'debit')

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: 'Finanzas', to: '/finanzas' },
          { label: 'Liquidaciones', to: '/finanzas/liquidaciones' },
          { label: settlement.code },
        ]}
        title={`Liquidación ${settlement.code}`}
        description={`${propertyLabel} · ${formatPeriod(settlement.period)}`}
        meta={
          <>
            <StatusBadge meta={STATUS_META[settlement.status]} />
            <Badge>Emitida {formatDate(settlement.createdAt)}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Detalle de la liquidación" />
          <CardBody className="px-0 py-0">
            <table className="w-full text-sm">
              <caption className="sr-only">Conceptos de la liquidación</caption>
              <tbody>
                {credits.map((line) => (
                  <tr key={line.concept} className="border-b border-slate-100">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal text-slate-800">
                      {line.concept}
                    </th>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums text-slate-900">
                      {formatMoney(line.amount)}
                    </td>
                  </tr>
                ))}
                {debits.map((line) => (
                  <tr key={line.concept} className="border-b border-slate-100">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal text-slate-600">
                      <span className="mr-1 text-slate-400" aria-hidden="true">
                        −
                      </span>
                      {line.concept}
                    </th>
                    <td className="px-4 py-2.5 text-right tabular-nums text-rose-700">
                      −{formatMoney(line.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50">
                  <th scope="row" className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                    A liquidar al propietario
                  </th>
                  <td
                    className={cn(
                      'px-4 py-3 text-right text-base font-semibold tabular-nums',
                      settlement.total.amount >= 0 ? 'text-emerald-800' : 'text-rose-700',
                    )}
                  >
                    {formatMoney(settlement.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title="Referencias" />
          <CardBody>
            <DescriptionList
              columns={2}
              items={[
                {
                  label: 'Propietario',
                  wide: true,
                  value: (
                    <Link to={`/clientes/${settlement.ownerId}`} className="text-brand-700 hover:underline">
                      {ownerName}
                    </Link>
                  ),
                },
                {
                  label: 'Contrato',
                  wide: true,
                  value: (
                    <Link to={`/alquileres/${settlement.rentalId}`} className="text-brand-700 hover:underline">
                      {rentalCode}
                    </Link>
                  ),
                },
                { label: 'Período', value: <span className="capitalize">{formatPeriod(settlement.period)}</span> },
                { label: 'Pagada', value: formatDate(settlement.paidAt) },
              ]}
            />
            <p className="mt-4 text-2xs text-slate-500">
              La transferencia al propietario y el comprobante se gestionan fuera de la demo.
            </p>
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
