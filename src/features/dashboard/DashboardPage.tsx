import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarClock,
  Clock,
  Home,
  KeyRound,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { useSession } from '@/app/SessionContext'
import {
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  KpiCard,
  LoadingState,
  PageContainer,
  PageHeader,
  Timeline,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatMoneyCompact, formatNumber } from '@/lib/format'
import { dashboardService, usersService } from '@/services'
import { AlertsList } from './AlertsList'
import { UpcomingEventsList } from './UpcomingEventsList'

export function DashboardPage() {
  const { user, can } = useSession()
  const kpis = useAsync(() => dashboardService.kpis(), [])
  const activity = useAsync(() => dashboardService.activity(8), [])
  const upcoming = useAsync(() => dashboardService.upcomingEvents(), [])
  const alerts = useAsync(() => dashboardService.alerts(), [])
  const users = useAsync(() => usersService.all(), [])

  const resolveUserName = (userId: string) =>
    users.data?.find((candidate) => candidate.id === userId)?.name ?? userId

  const showFinance = can('finance.view')

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Hola, ${user.name.split(' ')[0]}. Esto es lo que está pasando hoy en la inmobiliaria.`}
      />

      {kpis.loading && <LoadingState rows={2} />}
      {kpis.error && <ErrorState description={kpis.error.message} onRetry={kpis.reload} />}

      {kpis.data && (
        <section
          aria-label="Indicadores principales"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          <KpiCard
            label="Propiedades activas"
            value={formatNumber(kpis.data.activeProperties)}
            icon={Building2}
            tone="info"
            to="/propiedades"
          />
          <KpiCard
            label="En venta"
            value={formatNumber(kpis.data.forSale)}
            icon={Home}
            to="/propiedades?operacion=sale"
          />
          <KpiCard
            label="En alquiler"
            value={formatNumber(kpis.data.forRent)}
            icon={KeyRound}
            to="/propiedades?operacion=rent"
          />
          <KpiCard
            label="Leads nuevos"
            value={formatNumber(kpis.data.newLeads)}
            icon={UserPlus}
            tone="positive"
            to="/leads"
          />
          <KpiCard
            label="Visitas próximas"
            value={formatNumber(kpis.data.upcomingVisits)}
            icon={CalendarClock}
            tone="info"
            to="/visitas"
          />
          <KpiCard
            label="Operaciones del mes"
            value={formatNumber(kpis.data.operationsThisMonth)}
            icon={Briefcase}
            to="/operaciones"
          />
          {showFinance ? (
            <KpiCard
              label="Comisiones del mes"
              value={formatMoneyCompact(kpis.data.commissionsThisMonth)}
              hint="Operaciones cerradas en el mes"
              icon={Wallet}
              tone="positive"
              to="/finanzas"
            />
          ) : (
            <KpiCard
              label="Pagos pendientes"
              value={formatNumber(kpis.data.pendingPayments)}
              icon={Clock}
              tone="attention"
              to="/finanzas/pagos?estado=pending"
            />
          )}
          <KpiCard
            label="Pagos vencidos"
            value={formatNumber(kpis.data.overduePayments)}
            icon={AlertTriangle}
            tone={kpis.data.overduePayments > 0 ? 'critical' : 'neutral'}
            to="/finanzas/pagos?estado=overdue"
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="flex flex-col gap-5 xl:col-span-2">
          <Card>
            <CardHeader
              title="Requiere atención"
              description="Alertas generadas a partir de contratos, pagos, documentación y leads."
            />
            <CardBody className="px-0 py-0">
              {alerts.loading && <LoadingState rows={3} />}
              {alerts.error && (
                <ErrorState description={alerts.error.message} onRetry={alerts.reload} />
              )}
              {alerts.data && <AlertsList alerts={alerts.data} />}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Actividad reciente"
              description="Últimas acciones registradas en el sistema."
            />
            <CardBody>
              {activity.loading && <LoadingState rows={4} />}
              {activity.error && (
                <ErrorState description={activity.error.message} onRetry={activity.reload} />
              )}
              {activity.data && (
                <Timeline entries={activity.data} resolveUserName={resolveUserName} />
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="self-start">
          <CardHeader
            title="Próximos eventos"
            description="Visitas, vencimientos de pago y contratos."
          />
          <CardBody className="px-0 py-0">
            {upcoming.loading && <LoadingState rows={4} />}
            {upcoming.error && (
              <ErrorState description={upcoming.error.message} onRetry={upcoming.reload} />
            )}
            {upcoming.data && <UpcomingEventsList events={upcoming.data} />}
          </CardBody>
        </Card>
      </div>
    </PageContainer>
  )
}
