import type {
  AuditAction,
  DocumentStatus,
  DocumentType,
  EntityKind,
  LeadPriority,
  LeadSource,
  LeadStage,
  OperationKind,
  OperationPartyRole,
  OperationStatus,
  OperationType,
  PaymentMethod,
  PaymentStatus,
  PersonRole,
  PropertyStatus,
  PropertyType,
  RentalStatus,
  StatusTone,
  UserRole,
  UserStatus,
  VisitOutcome,
  VisitStatus,
} from '@/types'

/**
 * Single source of truth for every enum rendered in the UI: Spanish label plus
 * the semantic tone used by StatusBadge. Adding a state means adding it here,
 * which is what keeps the visual language consistent across modules.
 */
export interface StatusMeta {
  label: string
  tone: StatusTone
}

function meta<T extends string>(entries: Record<T, StatusMeta>): Record<T, StatusMeta> {
  return entries
}

export const propertyStatusMeta = meta<PropertyStatus>({
  available: { label: 'Disponible', tone: 'positive' },
  reserved: { label: 'Reservada', tone: 'attention' },
  rented: { label: 'Alquilada', tone: 'info' },
  sold: { label: 'Vendida', tone: 'neutral' },
  suspended: { label: 'Suspendida', tone: 'critical' },
  draft: { label: 'Borrador', tone: 'neutral' },
})

export const propertyTypeLabels: Record<PropertyType, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  ph: 'PH',
  land: 'Terreno',
  office: 'Oficina',
  store: 'Local',
  warehouse: 'Galpón',
  country_house: 'Casa quinta',
}

export const operationKindLabels: Record<OperationKind, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
  sale_rent: 'Venta y alquiler',
}

export const leadStageMeta = meta<LeadStage>({
  new: { label: 'Nuevo', tone: 'info' },
  contacted: { label: 'Contactado', tone: 'info' },
  qualified: { label: 'Calificado', tone: 'attention' },
  visit_scheduled: { label: 'Visita programada', tone: 'attention' },
  negotiation: { label: 'Negociación', tone: 'attention' },
  won: { label: 'Convertido', tone: 'positive' },
  lost: { label: 'Perdido', tone: 'critical' },
})

/** Kanban column order for the CRM board (spec section 10). */
export const leadStageOrder: LeadStage[] = [
  'new',
  'contacted',
  'qualified',
  'visit_scheduled',
  'negotiation',
  'won',
  'lost',
]

export const leadSourceLabels: Record<LeadSource, string> = {
  portal: 'Portal inmobiliario',
  website: 'Sitio web',
  referral: 'Referido',
  walk_in: 'Visita a oficina',
  phone: 'Teléfono',
  social: 'Redes sociales',
  sign: 'Cartel en propiedad',
}

export const leadPriorityMeta = meta<LeadPriority>({
  low: { label: 'Baja', tone: 'neutral' },
  medium: { label: 'Media', tone: 'info' },
  high: { label: 'Alta', tone: 'critical' },
})

export const visitStatusMeta = meta<VisitStatus>({
  scheduled: { label: 'Programada', tone: 'info' },
  confirmed: { label: 'Confirmada', tone: 'attention' },
  done: { label: 'Realizada', tone: 'positive' },
  cancelled: { label: 'Cancelada', tone: 'neutral' },
  no_show: { label: 'No asistió', tone: 'critical' },
})

export const visitOutcomeLabels: Record<VisitOutcome, string> = {
  interested: 'Interesado',
  not_interested: 'No interesado',
  offer: 'Presentó oferta',
  pending: 'A definir',
}

export const operationTypeLabels: Record<OperationType, string> = {
  sale: 'Venta',
  rent: 'Alquiler',
}

export const operationStatusMeta = meta<OperationStatus>({
  started: { label: 'Iniciada', tone: 'info' },
  reserved: { label: 'Reserva', tone: 'attention' },
  negotiation: { label: 'Negociación', tone: 'attention' },
  documentation: { label: 'Documentación', tone: 'attention' },
  signature: { label: 'Firma', tone: 'attention' },
  closed: { label: 'Finalizada', tone: 'positive' },
  cancelled: { label: 'Cancelada', tone: 'critical' },
})

/** Pipeline order used by the operation stepper. */
export const operationStatusOrder: OperationStatus[] = [
  'started',
  'reserved',
  'negotiation',
  'documentation',
  'signature',
  'closed',
]

export const operationPartyRoleLabels: Record<OperationPartyRole, string> = {
  buyer: 'Comprador',
  seller: 'Vendedor',
  owner: 'Propietario',
  tenant: 'Inquilino',
  guarantor: 'Garante',
}

export const rentalStatusMeta = meta<RentalStatus>({
  active: { label: 'Activo', tone: 'positive' },
  expiring: { label: 'Próximo a vencer', tone: 'attention' },
  expired: { label: 'Vencido', tone: 'critical' },
  finished: { label: 'Finalizado', tone: 'neutral' },
})

export const paymentStatusMeta = meta<PaymentStatus>({
  pending: { label: 'Pendiente', tone: 'attention' },
  paid: { label: 'Pagado', tone: 'positive' },
  overdue: { label: 'Vencido', tone: 'critical' },
  partial: { label: 'Parcial', tone: 'attention' },
})

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  check: 'Cheque',
  card: 'Tarjeta',
  debit: 'Débito automático',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  dni: 'DNI',
  deed: 'Escritura',
  contract: 'Contrato',
  reservation: 'Reserva',
  receipt: 'Comprobante',
  guarantee: 'Garantía',
  blueprint: 'Plano',
  tax: 'Documentación impositiva',
  other: 'Otro',
}

export const documentStatusMeta = meta<DocumentStatus>({
  valid: { label: 'Vigente', tone: 'positive' },
  expiring: { label: 'Próximo a vencer', tone: 'attention' },
  expired: { label: 'Vencido', tone: 'critical' },
  pending: { label: 'Pendiente', tone: 'attention' },
})

export const personRoleLabels: Record<PersonRole, string> = {
  owner: 'Propietario',
  buyer: 'Comprador',
  tenant: 'Inquilino',
  guarantor: 'Garante',
  investor: 'Inversor',
  contact: 'Contacto',
}

export const userRoleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  agent: 'Agente inmobiliario',
  back_office: 'Administración',
  accountant: 'Contador',
}

export const userStatusMeta = meta<UserStatus>({
  active: { label: 'Activo', tone: 'positive' },
  inactive: { label: 'Inactivo', tone: 'neutral' },
  blocked: { label: 'Bloqueado', tone: 'critical' },
})

export const auditActionLabels: Record<AuditAction, string> = {
  create: 'Creación',
  update: 'Modificación',
  delete: 'Eliminación',
  price_change: 'Cambio de precio',
  status_change: 'Cambio de estado',
  permission_change: 'Cambio de permisos',
  document_upload: 'Carga de documento',
  payment_register: 'Registro de pago',
  login: 'Inicio de sesión',
}

export const entityKindLabels: Record<EntityKind, string> = {
  property: 'Propiedad',
  client: 'Cliente',
  lead: 'Lead',
  visit: 'Visita',
  operation: 'Operación',
  rental: 'Alquiler',
  payment: 'Pago',
  document: 'Documento',
  user: 'Usuario',
  settlement: 'Liquidación',
}

/** Route prefix for each entity kind, so links can be built generically. */
export const entityKindPaths: Record<EntityKind, string | null> = {
  property: '/propiedades',
  client: '/clientes',
  lead: '/leads',
  visit: '/visitas',
  operation: '/operaciones',
  rental: '/alquileres',
  payment: null,
  document: null,
  user: '/usuarios',
  settlement: null,
}

export function entityHref(kind: EntityKind, id: string): string | undefined {
  const prefix = entityKindPaths[kind]
  return prefix ? `${prefix}/${id}` : undefined
}
