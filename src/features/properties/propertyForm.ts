import type { Property, PropertyDraft } from '@/types'

export type DraftErrors = Partial<
  Record<
    | 'title'
    | 'description'
    | 'street'
    | 'number'
    | 'neighborhood'
    | 'totalArea'
    | 'coveredArea'
    | 'priceAmount'
    | 'ownerId'
    | 'agentId',
    string
  >
>

export const EMPTY_DRAFT: PropertyDraft = {
  title: '',
  description: '',
  operation: 'sale',
  type: 'apartment',
  status: 'draft',
  priceAmount: 0,
  priceCurrency: 'USD',
  location: {
    street: '',
    number: '',
    neighborhood: '',
    city: 'Córdoba',
    province: 'Córdoba',
  },
  features: {
    totalArea: 0,
    coveredArea: 0,
    bedrooms: 0,
    bathrooms: 0,
    rooms: 0,
    garage: 0,
    ageYears: 0,
    amenities: [],
  },
  ownerId: '',
  agentId: '',
  published: false,
}

export function draftFromProperty(property: Property): PropertyDraft {
  return {
    title: property.title,
    description: property.description,
    operation: property.operation,
    type: property.type,
    status: property.status,
    priceAmount: property.price.amount,
    priceCurrency: property.price.currency,
    location: { ...property.location },
    features: { ...property.features, amenities: [...property.features.amenities] },
    ownerId: property.ownerId,
    agentId: property.agentId,
    published: property.published,
  }
}

/** Form-level validation; kept outside the component so it can be unit tested. */
export function validateDraft(draft: PropertyDraft): DraftErrors {
  const errors: DraftErrors = {}
  if (draft.title.trim().length < 8) errors.title = 'Ingresá un título de al menos 8 caracteres.'
  if (draft.description.trim().length < 40) {
    errors.description = 'La descripción debe tener al menos 40 caracteres.'
  }
  if (!draft.location.street.trim()) errors.street = 'La calle es obligatoria.'
  if (!draft.location.number.trim()) errors.number = 'Obligatorio.'
  if (!draft.location.neighborhood.trim()) errors.neighborhood = 'El barrio es obligatorio.'
  if (!(draft.features.totalArea > 0)) errors.totalArea = 'Debe ser mayor a cero.'
  if (draft.features.coveredArea > draft.features.totalArea) {
    errors.coveredArea = 'No puede superar la superficie total.'
  }
  if (!(draft.priceAmount > 0)) errors.priceAmount = 'Ingresá un precio mayor a cero.'
  if (!draft.ownerId) errors.ownerId = 'Seleccioná un propietario.'
  if (!draft.agentId) errors.agentId = 'Seleccioná un agente.'
  return errors
}
