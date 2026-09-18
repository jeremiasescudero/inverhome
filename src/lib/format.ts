import type { Currency, IsoDate, Money } from '@/types'

const LOCALE = 'es-AR'

const currencyFormatters: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }),
}

const numberFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

const decimalFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatMoney(money: Money | undefined | null): string {
  if (!money) return '—'
  return currencyFormatters[money.currency].format(money.amount)
}

/** Compact form for KPI cards and chart axes: USD 1,2 M / $ 450 mil. */
export function formatMoneyCompact(money: Money | undefined | null): string {
  if (!money) return '—'
  const prefix = money.currency === 'USD' ? 'USD' : '$'
  const abs = Math.abs(money.amount)
  if (abs >= 1_000_000) return `${prefix} ${decimalFormatter.format(money.amount / 1_000_000)} M`
  if (abs >= 10_000) return `${prefix} ${numberFormatter.format(Math.round(money.amount / 1000))} mil`
  return `${prefix} ${numberFormatter.format(money.amount)}`
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatArea(squareMeters: number): string {
  return `${numberFormatter.format(squareMeters)} m²`
}

export function formatPercent(rate: number, fractionDigits = 1): string {
  return `${rate.toFixed(fractionDigits).replace('.', ',')} %`
}

function toDate(value: IsoDate | Date): Date {
  return value instanceof Date ? value : new Date(value)
}

export function formatDate(value: IsoDate | Date | undefined | null): string {
  if (!value) return '—'
  return toDate(value).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateLong(value: IsoDate | Date | undefined | null): string {
  if (!value) return '—'
  return toDate(value).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDateTime(value: IsoDate | Date | undefined | null): string {
  if (!value) return '—'
  const date = toDate(value)
  return `${formatDate(date)} ${date.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

/** Period keys are stored as YYYY-MM and displayed as "sep 2026". */
export function formatPeriod(period: string): string {
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString(LOCALE, { month: 'short', year: 'numeric' })
}

/**
 * Relative distance in days from today. Positive means the date is in the
 * future; used by alerts ("vence en 12 días") and by expiry calculations.
 */
export function daysFromToday(value: IsoDate | Date, today: Date = new Date()): number {
  const target = toDate(value)
  const startOfTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((startOfTarget - startOfToday) / 86_400_000)
}

export function formatRelativeDate(value: IsoDate | Date, today: Date = new Date()): string {
  const days = daysFromToday(value, today)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Mañana'
  if (days === -1) return 'Ayer'
  if (days > 0 && days < 30) return `En ${days} días`
  if (days < 0 && days > -30) return `Hace ${Math.abs(days)} días`
  return formatDate(value)
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function fullName(person: { firstName: string; lastName: string }): string {
  return `${person.firstName} ${person.lastName}`
}
