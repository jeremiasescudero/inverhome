import type { EntityKind, Id, IsoDate } from './common'

export type DocumentType =
  | 'dni'
  | 'deed'
  | 'contract'
  | 'reservation'
  | 'receipt'
  | 'guarantee'
  | 'blueprint'
  | 'tax'
  | 'other'

export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'pending'

export interface StoredDocument {
  id: Id
  name: string
  type: DocumentType
  /** Entity the document belongs to, so every module can list its own files. */
  entityKind: EntityKind
  entityId: Id
  entityLabel: string
  uploadedById: Id
  uploadedAt: IsoDate
  status: DocumentStatus
  expiresAt?: IsoDate
  sizeKb: number
  format: 'pdf' | 'jpg' | 'png' | 'docx'
}

export interface DocumentFilters {
  search?: string
  type?: DocumentType | 'all'
  status?: DocumentStatus | 'all'
  entityKind?: EntityKind | 'all'
}
