import type { Id, IsoDate } from './common'

/**
 * A person is stored once and can play several commercial roles at the same
 * time (spec section 9): the same human may own one property and rent another.
 */
export type PersonRole = 'owner' | 'buyer' | 'tenant' | 'guarantor' | 'investor' | 'contact'

export type DocumentIdType = 'DNI' | 'CUIT' | 'CUIL' | 'PASAPORTE'

export interface Person {
  id: Id
  firstName: string
  lastName: string
  documentType: DocumentIdType
  documentNumber: string
  email: string
  phone: string
  address?: string
  city?: string
  roles: PersonRole[]
  notes?: string
  createdAt: IsoDate
  lastActivityAt?: IsoDate
}

export interface PersonWithStats extends Person {
  propertiesCount: number
  operationsCount: number
}

export interface PersonFilters {
  search?: string
  role?: PersonRole | 'all'
}
