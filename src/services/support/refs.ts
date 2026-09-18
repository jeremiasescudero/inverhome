import { db } from '@/mocks/db'
import { fullName } from '@/lib/format'
import type { Id, Property, PropertyLocation } from '@/types'

/**
 * Internal helpers shared by the services to resolve relations into the flat,
 * label-carrying shapes a list endpoint would return. Not part of the public
 * service surface.
 */

export function findUser(id: Id | undefined) {
  return db.users.find((user) => user.id === id)
}

export function findPerson(id: Id | undefined) {
  return db.people.find((person) => person.id === id)
}

export function findProperty(id: Id | undefined) {
  return db.properties.find((property) => property.id === id)
}

export function findRental(id: Id | undefined) {
  return db.rentals.find((rental) => rental.id === id)
}

export function userName(id: Id | undefined): string {
  return findUser(id)?.name ?? 'Sin asignar'
}

export function personName(id: Id | undefined): string {
  const person = findPerson(id)
  return person ? fullName(person) : 'Sin asignar'
}

export function formatAddress(location: PropertyLocation): string {
  const unit = [location.floor && `Piso ${location.floor}`, location.unit && `Dto. ${location.unit}`]
    .filter(Boolean)
    .join(' ')
  const street = `${location.street} ${location.number}`
  return [street, unit, location.neighborhood].filter(Boolean).join(', ')
}

export function propertyLabel(id: Id | undefined): string {
  const property = findProperty(id)
  return property ? `${property.code} — ${property.title}` : 'Sin propiedad'
}

export function propertyShortLabel(property: Property): string {
  return `${property.code} — ${property.title}`
}
