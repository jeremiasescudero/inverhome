import type { Page, PageRequest } from '@/types'

/**
 * Transport shim for the mock backend.
 *
 * Every service returns a Promise and fails with `ApiError`, so swapping the
 * mock for `fetch` later is a change inside the services only — no page or
 * hook needs to be touched (spec section 28).
 */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function notFound(entity: string, id: string): ApiError {
  return new ApiError(`No se encontró ${entity} con identificador ${id}.`, 404)
}

/** Tests run with no artificial latency; the app keeps a short one so that
 *  loading states are real instead of decorative. */
const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 180

export function respond<T>(value: T): Promise<T> {
  if (LATENCY_MS === 0) return Promise.resolve(value)
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), LATENCY_MS)
  })
}

export function fail<T = never>(error: ApiError): Promise<T> {
  return Promise.reject(error)
}

/** Case- and accent-insensitive contains, so "Gomez" matches "Gómez". */
export function matches(haystack: string | undefined, needle: string): boolean {
  if (!needle) return true
  if (!haystack) return false
  return normalize(haystack).includes(normalize(needle))
}

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function paginate<T>(items: T[], request: PageRequest = {}): Page<T> {
  const page = Math.max(1, request.page ?? 1)
  const pageSize = request.pageSize ?? 10
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

type Comparable = string | number | undefined

/** Stable sort by an extracted key, with `undefined` always last. */
export function sortBy<T>(
  items: T[],
  extract: (item: T) => Comparable,
  direction: 'asc' | 'desc' = 'asc',
): T[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const left = extract(a)
    const right = extract(b)
    if (left === undefined) return 1
    if (right === undefined) return -1
    if (typeof left === 'number' && typeof right === 'number') {
      return (left - right) * factor
    }
    return String(left).localeCompare(String(right), 'es-AR') * factor
  })
}
