import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import type { StatusTone } from '@/types'

export interface KpiCardProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone?: StatusTone
  to?: string
}

const TONE_ACCENT: Record<StatusTone, string> = {
  positive: 'text-emerald-700 bg-emerald-50',
  attention: 'text-amber-700 bg-amber-50',
  info: 'text-sky-700 bg-sky-50',
  critical: 'text-rose-700 bg-rose-50',
  neutral: 'text-slate-600 bg-slate-100',
}

export function KpiCard({ label, value, hint, icon: Icon, tone = 'neutral', to }: KpiCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md',
            TONE_ACCENT[tone],
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-0.5 text-2xs text-slate-500">{hint}</p>}
    </>
  )

  const className = cn(
    'block rounded-lg border border-slate-200 bg-white px-3.5 py-3',
    to && 'transition-colors hover:border-brand-300 hover:bg-brand-50/30',
  )

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}
