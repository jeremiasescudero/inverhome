import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { StatusMeta } from '@/lib/labels'
import type { StatusTone } from '@/types'

const TONE_CLASSES: Record<StatusTone, string> = {
  positive: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  attention: 'bg-amber-50 text-amber-900 border-amber-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  critical: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
}

/**
 * Status is never signalled by colour alone: each tone also carries a distinct
 * icon and its label in words (spec section 25).
 */
const TONE_ICONS: Record<StatusTone, LucideIcon> = {
  positive: CheckCircle2,
  attention: Clock,
  info: CircleDashed,
  critical: AlertTriangle,
  neutral: Ban,
}

export interface BadgeProps {
  children: React.ReactNode
  tone?: StatusTone
  className?: string
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export interface StatusBadgeProps {
  meta: StatusMeta
  showIcon?: boolean
  className?: string
}

export function StatusBadge({ meta, showIcon = true, className }: StatusBadgeProps) {
  const Icon = TONE_ICONS[meta.tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-medium',
        TONE_CLASSES[meta.tone],
        className,
      )}
    >
      {showIcon && <Icon className="size-3 shrink-0" aria-hidden="true" />}
      {meta.label}
    </span>
  )
}
