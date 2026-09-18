import { db, DEMO_TODAY } from '@/mocks/db'
import { daysFromToday, formatMoney, formatPeriod } from '@/lib/format'
import type { ActivityEntry, Alert, Money, UpcomingEvent } from '@/types'
import { respond } from './api'
import { MOCK_USD_ARS } from './finance.service'
import { personName, propertyLabel, userName } from './support/refs'

export interface DashboardKpis {
  activeProperties: number
  forSale: number
  forRent: number
  newLeads: number
  upcomingVisits: number
  operationsThisMonth: number
  commissionsThisMonth: Money
  pendingPayments: number
  overduePayments: number
}

/** Statuses that keep a property in the active portfolio. */
const ACTIVE_STATUSES = ['available', 'reserved', 'rented']

export const dashboardService = {
  kpis(today: string = DEMO_TODAY): Promise<DashboardKpis> {
    const currentPeriod = today.slice(0, 7)

    const commissions = db.operations
      .filter((operation) => operation.closedAt?.startsWith(currentPeriod))
      .reduce(
        (total, operation) =>
          total +
          (operation.commission.currency === 'USD'
            ? operation.commission.amount * MOCK_USD_ARS
            : operation.commission.amount),
        0,
      )

    return respond({
      activeProperties: db.properties.filter((property) =>
        ACTIVE_STATUSES.includes(property.status),
      ).length,
      forSale: db.properties.filter(
        (property) =>
          (property.operation === 'sale' || property.operation === 'sale_rent') &&
          ACTIVE_STATUSES.includes(property.status),
      ).length,
      forRent: db.properties.filter(
        (property) =>
          (property.operation === 'rent' || property.operation === 'sale_rent') &&
          ACTIVE_STATUSES.includes(property.status),
      ).length,
      newLeads: db.leads.filter((lead) => lead.stage === 'new').length,
      upcomingVisits: db.visits.filter(
        (visit) =>
          visit.date >= today && (visit.status === 'scheduled' || visit.status === 'confirmed'),
      ).length,
      operationsThisMonth: db.operations.filter(
        (operation) =>
          operation.startedAt.startsWith(currentPeriod) ||
          operation.closedAt?.startsWith(currentPeriod),
      ).length,
      commissionsThisMonth: { amount: Math.round(commissions), currency: 'ARS' },
      pendingPayments: db.payments.filter((payment) => payment.status !== 'paid').length,
      overduePayments: db.payments.filter((payment) => payment.status === 'overdue').length,
    })
  },

  /** Recent activity feed, built from the audit trail. */
  activity(limit = 8): Promise<ActivityEntry[]> {
    const entries = db.auditEvents.slice(0, limit).map<ActivityEntry>((event) => ({
      id: `feed-${event.id}`,
      at: event.at,
      userId: event.userId,
      title: `${userName(event.userId)} · ${event.summary}`,
      description: event.changes
        ?.map((change) => `${change.field}: ${change.before} → ${change.after}`)
        .join(' · '),
      icon:
        event.action === 'price_change'
          ? 'price'
          : event.action === 'payment_register'
            ? 'payment'
            : event.action === 'document_upload'
              ? 'document'
              : event.entityKind === 'lead'
                ? 'lead'
                : event.entityKind === 'visit'
                  ? 'visit'
                  : event.entityKind === 'operation'
                    ? 'operation'
                    : event.entityKind === 'user'
                      ? 'user'
                      : 'property',
      entityKind: event.entityKind,
      entityId: event.entityId,
    }))
    return respond(entries)
  },

  /** Visits, payment due dates, contract endings and adjustments ahead. */
  upcomingEvents(today: string = DEMO_TODAY, limit = 8): Promise<UpcomingEvent[]> {
    const events: UpcomingEvent[] = []

    for (const visit of db.visits) {
      if (visit.date < today) continue
      if (visit.status === 'cancelled' || visit.status === 'no_show') continue
      events.push({
        id: `event-${visit.id}`,
        at: `${visit.date}T${visit.time}:00`,
        kind: 'visit',
        title: `Visita ${visit.time} · ${propertyLabel(visit.propertyId)}`,
        description: `${personName(visit.personId)} · ${userName(visit.agentId)}`,
        href: `/visitas?visita=${visit.id}`,
      })
    }

    for (const payment of db.payments) {
      if (payment.status === 'paid' || payment.dueDate < today) continue
      events.push({
        id: `event-${payment.id}`,
        at: payment.dueDate,
        kind: 'payment',
        title: `Vence el alquiler ${payment.rentalId} · ${formatPeriod(payment.period)}`,
        description: formatMoney(payment.amount),
        href: `/finanzas/pagos?pago=${payment.id}`,
      })
    }

    for (const rental of db.rentals) {
      if (rental.endDate >= today) {
        events.push({
          id: `event-${rental.id}-end`,
          at: rental.endDate,
          kind: 'contract',
          title: `Vence el contrato ${rental.code}`,
          description: propertyLabel(rental.propertyId),
          href: `/alquileres/${rental.id}`,
        })
      }
      if (rental.nextAdjustmentDate >= today) {
        events.push({
          id: `event-${rental.id}-adj`,
          at: rental.nextAdjustmentDate,
          kind: 'adjustment',
          title: `Actualización de monto ${rental.code}`,
          description: `Cada ${rental.adjustmentPeriodMonths} meses`,
          href: `/alquileres/${rental.id}`,
        })
      }
    }

    return respond(events.sort((a, b) => a.at.localeCompare(b.at)).slice(0, limit))
  },

  alerts(today: string = DEMO_TODAY): Promise<Alert[]> {
    const alerts: Alert[] = []
    const reference = new Date(today)

    for (const rental of db.rentals) {
      const remaining = daysFromToday(rental.endDate, reference)
      if (remaining >= 0 && remaining <= 60) {
        alerts.push({
          id: `alert-${rental.id}`,
          severity: 'attention',
          title: `El contrato ${rental.code} vence en ${remaining} días`,
          description: propertyLabel(rental.propertyId),
          href: `/alquileres/${rental.id}`,
        })
      } else if (rental.status === 'expired') {
        alerts.push({
          id: `alert-${rental.id}`,
          severity: 'critical',
          title: `El contrato ${rental.code} está vencido`,
          description: `${propertyLabel(rental.propertyId)} · ${personName(rental.tenantId)}`,
          href: `/alquileres/${rental.id}`,
        })
      }
    }

    const overdue = db.payments.filter((payment) => payment.status === 'overdue')
    if (overdue.length > 0) {
      alerts.push({
        id: 'alert-overdue-payments',
        severity: 'critical',
        title: `${overdue.length} pagos vencidos`,
        description: overdue.map((payment) => payment.rentalId).join(', '),
        href: '/finanzas/pagos?estado=overdue',
      })
    }

    const pendingDocs = db.documents.filter((document) => document.status === 'pending')
    if (pendingDocs.length > 0) {
      alerts.push({
        id: 'alert-pending-docs',
        severity: 'attention',
        title: `Falta documentación en ${pendingDocs.length} registros`,
        description: pendingDocs.map((document) => document.entityLabel).join(' · '),
        href: '/documentos?estado=pending',
      })
    }

    const unpublished = db.properties.filter(
      (property) => !property.published && property.status !== 'sold',
    )
    if (unpublished.length > 0) {
      alerts.push({
        id: 'alert-unpublished',
        severity: 'info',
        title: `${unpublished.length} propiedades sin publicar`,
        description: unpublished.map((property) => property.code).join(', '),
        href: '/propiedades?publicadas=no',
      })
    }

    const staleLeads = db.leads.filter(
      (lead) => !lead.nextContactAt && lead.stage !== 'won' && lead.stage !== 'lost',
    )
    if (staleLeads.length > 0) {
      alerts.push({
        id: 'alert-stale-leads',
        severity: 'attention',
        title: `${staleLeads.length} leads sin próximo contacto agendado`,
        description: staleLeads.map((lead) => lead.code).join(', '),
        href: '/leads',
      })
    }

    const severityOrder = { critical: 0, attention: 1, info: 2 }
    return respond(
      alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]).slice(0, 6),
    )
  },
}
