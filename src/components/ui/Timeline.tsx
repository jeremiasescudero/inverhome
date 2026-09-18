import {
  Banknote,
  Building2,
  CircleUser,
  FileText,
  Handshake,
  KeyRound,
  MapPin,
  TrendingUp,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
import { formatDateTime } from '@/lib/format'
import { entityHref } from '@/lib/labels'
import type { ActivityEntry, ActivityIcon } from '@/types'
import { Link } from 'react-router-dom'
import { EmptyState } from './States'

const ICONS: Record<ActivityIcon, LucideIcon> = {
  property: Building2,
  client: CircleUser,
  lead: Handshake,
  visit: MapPin,
  operation: KeyRound,
  payment: Banknote,
  document: FileText,
  price: TrendingUp,
  user: UserCog,
}

export interface TimelineProps {
  entries: ActivityEntry[]
  /** Resolves a user id to a display name; omitted when the feed has no actor. */
  resolveUserName?: (userId: string) => string
  emptyTitle?: string
}

export function Timeline({ entries, resolveUserName, emptyTitle = 'Sin actividad' }: TimelineProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="Las acciones registradas van a aparecer acá."
      />
    )
  }

  return (
    <ol className="relative space-y-0">
      {entries.map((entry, index) => {
        const Icon = ICONS[entry.icon]
        const href = entry.entityKind && entry.entityId
          ? entityHref(entry.entityKind, entry.entityId)
          : undefined
        const isLast = index === entries.length - 1

        return (
          <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
            {!isLast && (
              <span
                className="absolute top-7 left-3.5 h-full w-px bg-slate-200"
                aria-hidden="true"
              />
            )}
            <span className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm text-slate-800">
                {href ? (
                  <Link to={href} className="font-medium hover:text-brand-700 hover:underline">
                    {entry.title}
                  </Link>
                ) : (
                  <span className="font-medium">{entry.title}</span>
                )}
              </p>
              {entry.description && (
                <p className="mt-0.5 text-xs text-slate-500">{entry.description}</p>
              )}
              <p className="mt-0.5 text-2xs text-slate-400">
                {formatDateTime(entry.at)}
                {entry.userId && resolveUserName && ` · ${resolveUserName(entry.userId)}`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
