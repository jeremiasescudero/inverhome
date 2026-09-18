import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/app/layout/AppLayout'
import { RequirePermission } from '@/app/RequirePermission'
import { SessionProvider } from '@/app/SessionContext'
import { ToastProvider } from '@/app/ToastContext'
import { EmptyState, LoadingState, PageContainer } from '@/components/ui'
import type { Permission } from '@/lib/permissions'
import { AuditPage } from '@/features/audit/AuditPage'
import { ClientDetailPage } from '@/features/clients/ClientDetailPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { DocumentsPage } from '@/features/documents/DocumentsPage'
import { SettlementDetailPage } from '@/features/finance/SettlementDetailPage'
import { SettlementsPage } from '@/features/finance/SettlementsPage'
import { LeadDetailPage } from '@/features/leads/LeadDetailPage'
import { LeadsPage } from '@/features/leads/LeadsPage'
import { OperationDetailPage } from '@/features/operations/OperationDetailPage'
import { OperationsPage } from '@/features/operations/OperationsPage'
import { PaymentsPage } from '@/features/payments/PaymentsPage'
import { PropertiesPage } from '@/features/properties/PropertiesPage'
import { PropertyDetailPage } from '@/features/properties/PropertyDetailPage'
import { PropertyFormPage } from '@/features/properties/PropertyFormPage'
import { RentalDetailPage } from '@/features/rentals/RentalDetailPage'
import { RentalsPage } from '@/features/rentals/RentalsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { UsersPage } from '@/features/users/UsersPage'
import { VisitsPage } from '@/features/visits/VisitsPage'

// Chart-heavy screens load on demand so the initial bundle stays small.
const FinancePage = lazy(() =>
  import('@/features/finance/FinancePage').then((module) => ({ default: module.FinancePage })),
)
const ReportsPage = lazy(() =>
  import('@/features/reports/ReportsPage').then((module) => ({ default: module.ReportsPage })),
)

function guarded(anyOf: Permission[], element: ReactNode) {
  return (
    <RequirePermission anyOf={anyOf}>
      <Suspense
        fallback={
          <PageContainer>
            <LoadingState rows={6} />
          </PageContainer>
        }
      >
        {element}
      </Suspense>
    </RequirePermission>
  )
}

/**
 * Route table. Every feature route is guarded by the RBAC matrix; the same
 * check must be repeated server-side once a real API exists.
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={guarded(['dashboard.view'], <DashboardPage />)} />

        <Route path="/propiedades" element={guarded(['properties.view'], <PropertiesPage />)} />
        <Route
          path="/propiedades/nueva"
          element={guarded(['properties.manage', 'properties.manage_own'], <PropertyFormPage />)}
        />
        <Route path="/propiedades/:id" element={guarded(['properties.view'], <PropertyDetailPage />)} />
        <Route
          path="/propiedades/:id/editar"
          element={guarded(['properties.manage', 'properties.manage_own'], <PropertyFormPage />)}
        />

        <Route path="/clientes" element={guarded(['clients.view'], <ClientsPage />)} />
        <Route path="/clientes/:id" element={guarded(['clients.view'], <ClientDetailPage />)} />

        <Route path="/leads" element={guarded(['leads.view'], <LeadsPage />)} />
        <Route path="/leads/:id" element={guarded(['leads.view'], <LeadDetailPage />)} />

        <Route path="/visitas" element={guarded(['visits.view'], <VisitsPage />)} />

        <Route path="/operaciones" element={guarded(['operations.view'], <OperationsPage />)} />
        <Route path="/operaciones/:id" element={guarded(['operations.view'], <OperationDetailPage />)} />

        <Route path="/alquileres" element={guarded(['rentals.view'], <RentalsPage />)} />
        <Route path="/alquileres/:id" element={guarded(['rentals.view'], <RentalDetailPage />)} />

        <Route
          path="/finanzas"
          element={guarded(['finance.view', 'finance.view_own_commissions'], <FinancePage />)}
        />
        <Route path="/finanzas/pagos" element={guarded(['payments.view'], <PaymentsPage />)} />
        <Route path="/finanzas/liquidaciones" element={guarded(['settlements.view'], <SettlementsPage />)} />
        <Route
          path="/finanzas/liquidaciones/:id"
          element={guarded(['settlements.view'], <SettlementDetailPage />)}
        />

        <Route path="/documentos" element={guarded(['documents.view'], <DocumentsPage />)} />
        <Route path="/reportes" element={guarded(['reports.view'], <ReportsPage />)} />
        <Route path="/auditoria" element={guarded(['audit.view'], <AuditPage />)} />
        <Route path="/usuarios" element={guarded(['users.view'], <UsersPage />)} />
        <Route path="/configuracion" element={guarded(['settings.view'], <SettingsPage />)} />

        <Route
          path="*"
          element={
            <PageContainer>
              <EmptyState
                title="Página no encontrada"
                description="La ruta solicitada no existe en esta demo."
              />
            </PageContainer>
          }
        />
      </Route>
    </Routes>
  )
}

/** Providers every screen relies on; tests mount the same tree with a memory router. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  )
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
