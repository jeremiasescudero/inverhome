/**
 * Public service surface. Pages and hooks import from here only, so replacing
 * the mock implementations with real HTTP calls stays contained to this folder.
 */
export { ApiError } from './api'
export { auditService } from './audit.service'
export type { AuditListItem } from './audit.service'
export { clientsService } from './clients.service'
export type { ClientDetail, ClientListItem } from './clients.service'
export { dashboardService } from './dashboard.service'
export type { DashboardKpis } from './dashboard.service'
export { documentsService } from './documents.service'
export type { DocumentListItem } from './documents.service'
export { financeService, MOCK_USD_ARS } from './finance.service'
export type {
  CommissionRow,
  FinanceSummary,
  MonthlyFlow,
  PendingSettlementRow,
} from './finance.service'
export { leadsService } from './leads.service'
export type { LeadBoardColumn, LeadDetail, LeadListItem } from './leads.service'
export { notificationsService } from './notifications.service'
export { operationsService } from './operations.service'
export type { OperationDetail, OperationListItem } from './operations.service'
export { paymentsService } from './payments.service'
export type { PaymentListItem, SettlementDetail } from './payments.service'
export { propertiesService } from './properties.service'
export type { PropertyDetail, PropertyListItem } from './properties.service'
export { rentalsService } from './rentals.service'
export type { RentalDetail, RentalListItem } from './rentals.service'
export { reportsService } from './reports.service'
export type {
  AgentPerformanceRow,
  CategoryDatum,
  CommercialReports,
  FinancialReports,
  PropertyReports,
  SeriesDatum,
} from './reports.service'
export { searchService } from './search.service'
export type { SearchGroup, SearchHit } from './search.service'
export { usersService } from './users.service'
export type { UserFilters, UserListItem } from './users.service'
export { visitsService } from './visits.service'
export type { VisitDay, VisitDetail, VisitListItem } from './visits.service'
