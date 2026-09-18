import type { Currency, Id, IsoDate, Money } from './common'

export type OperationKind = 'sale' | 'rent' | 'sale_rent'

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'ph'
  | 'land'
  | 'office'
  | 'store'
  | 'warehouse'
  | 'country_house'

export type PropertyStatus =
  | 'available'
  | 'reserved'
  | 'rented'
  | 'sold'
  | 'suspended'
  | 'draft'

export interface PropertyFeatures {
  totalArea: number
  coveredArea: number
  bedrooms: number
  bathrooms: number
  rooms: number
  garage: number
  ageYears: number
  /** Monthly building expenses, always in ARS. */
  expenses?: number
  amenities: string[]
}

export interface PropertyLocation {
  street: string
  number: string
  floor?: string
  unit?: string
  neighborhood: string
  city: string
  province: string
}

export interface Property {
  id: Id
  code: string
  title: string
  description: string
  operation: OperationKind
  type: PropertyType
  status: PropertyStatus
  price: Money
  /** Rent price, used when the property is offered for both operations. */
  rentPrice?: Money
  location: PropertyLocation
  features: PropertyFeatures
  ownerId: Id
  agentId: Id
  images: string[]
  published: boolean
  createdAt: IsoDate
  updatedAt: IsoDate
}

export interface PropertyFilters {
  search?: string
  operation?: OperationKind | 'all'
  type?: PropertyType | 'all'
  status?: PropertyStatus | 'all'
  agentId?: Id | 'all'
  neighborhood?: string | 'all'
  minPrice?: number
  maxPrice?: number
  minRooms?: number
  publishedOnly?: boolean
}

/** Payload accepted by the create/update form (spec section 8). */
export interface PropertyDraft {
  title: string
  description: string
  operation: OperationKind
  type: PropertyType
  status: PropertyStatus
  priceAmount: number
  priceCurrency: Currency
  location: PropertyLocation
  features: PropertyFeatures
  ownerId: Id
  agentId: Id
  published: boolean
}
