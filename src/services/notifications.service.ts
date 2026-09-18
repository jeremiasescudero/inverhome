import { db, DEMO_TODAY } from '@/mocks/db'
import { daysFromToday } from '@/lib/format'
import type { AppNotification } from '@/types'
import { respond } from './api'
import { propertyLabel } from './support/refs'

/**
 * Notifications are derived from the data instead of being a static list, so
 * they stay true after the demo user changes something (spec section 27).
 */
export const notificationsService = {
  list(today: string = DEMO_TODAY): Promise<AppNotification[]> {
    const notifications: AppNotification[] = []
    const reference = new Date(today)

    const todayVisits = db.visits.filter(
      (visit) =>
        visit.date === today && (visit.status === 'scheduled' || visit.status === 'confirmed'),
    )
    if (todayVisits.length > 0) {
      notifications.push({
        id: 'notif-visits-today',
        title: `Tenés ${todayVisits.length} ${todayVisits.length === 1 ? 'visita' : 'visitas'} hoy`,
        description: todayVisits
          .map((visit) => `${visit.time} · ${propertyLabel(visit.propertyId)}`)
          .join(' · '),
        at: `${today}T08:00:00`,
        read: false,
        href: '/visitas',
        tone: 'info',
      })
    }

    for (const rental of db.rentals) {
      const remaining = daysFromToday(rental.endDate, reference)
      if (remaining >= 0 && remaining <= 60) {
        notifications.push({
          id: `notif-${rental.id}`,
          title: `El contrato ${rental.code} vence en ${remaining} días`,
          description: propertyLabel(rental.propertyId),
          at: `${today}T08:05:00`,
          read: false,
          href: `/alquileres/${rental.id}`,
          tone: 'attention',
        })
      }
    }

    const overdue = db.payments.filter((payment) => payment.status === 'overdue')
    if (overdue.length > 0) {
      notifications.push({
        id: 'notif-overdue',
        title: `Hay ${overdue.length} pagos vencidos`,
        description: 'Revisá la cobranza de alquileres.',
        at: `${today}T08:10:00`,
        read: false,
        href: '/finanzas/pagos?estado=overdue',
        tone: 'critical',
      })
    }

    const newLeads = db.leads.filter((lead) => lead.stage === 'new')
    if (newLeads.length > 0) {
      notifications.push({
        id: 'notif-new-leads',
        title: `${newLeads.length} leads nuevos sin contactar`,
        description: newLeads.map((lead) => lead.code).join(', '),
        at: `${today}T08:15:00`,
        read: true,
        href: '/leads',
        tone: 'info',
      })
    }

    const pendingDocs = db.documents.filter((document) => document.status === 'pending')
    for (const document of pendingDocs.slice(0, 2)) {
      notifications.push({
        id: `notif-${document.id}`,
        title: `Falta documentación en ${document.entityLabel}`,
        description: document.name,
        at: `${today}T08:20:00`,
        read: true,
        href: '/documentos?estado=pending',
        tone: 'attention',
      })
    }

    return respond(notifications)
  },
}
