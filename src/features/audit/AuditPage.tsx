import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  LoadingState,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { formatDate, formatDateTime } from '@/lib/format'
import { auditActionLabels, entityHref, entityKindLabels, userRoleLabels } from '@/lib/labels'
import { auditService, usersService, type AuditListItem } from '@/services'
import type { AuditAction, AuditFilters, EntityKind, UserRole } from '@/types'

const ENTITY_KINDS = Object.keys(entityKindLabels) as EntityKind[]
const ACTIONS = Object.keys(auditActionLabels) as AuditAction[]

export function AuditPage() {
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState('all')
  const [action, setAction] = useState('all')
  const [entityKind, setEntityKind] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<AuditFilters>(
    () => ({
      search: debouncedSearch,
      userId,
      action: action as AuditAction | 'all',
      entityKind: entityKind as EntityKind | 'all',
      from: from || undefined,
      to: to || undefined,
    }),
    [debouncedSearch, userId, action, entityKind, from, to],
  )

  const list = useAsync(() => auditService.list(filters, { page }), [filters, page])
  const users = useAsync(() => usersService.all(), [])

  function update(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  const activeCount = [userId !== 'all', action !== 'all', entityKind !== 'all', from !== '', to !== ''].filter(Boolean).length

  return (
    <PageContainer>
      <PageHeader
        title="Auditoría"
        description="Registro de acciones críticas: quién hizo qué, sobre qué entidad y cuándo."
      />

      <Card>
        <FilterBar
          lead={<SearchInput value={search} onChange={update(setSearch)} placeholder="Buscar por descripción o entidad…" />}
          onClear={() => {
            setUserId('all')
            setAction('all')
            setEntityKind('all')
            setFrom('')
            setTo('')
            setPage(1)
          }}
          activeCount={activeCount}
        >
          <FilterSelect
            label="Usuario"
            value={userId}
            onChange={update(setUserId)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(users.data ?? []).map((user) => ({ value: user.id, label: user.name })),
            ]}
          />
          <FilterSelect
            label="Acción"
            value={action}
            onChange={update(setAction)}
            options={[{ value: 'all', label: 'Todas' }, ...ACTIONS.map((key) => ({ value: key, label: auditActionLabels[key] }))]}
          />
          <FilterSelect
            label="Entidad"
            value={entityKind}
            onChange={update(setEntityKind)}
            options={[{ value: 'all', label: 'Todas' }, ...ENTITY_KINDS.map((key) => ({ value: key, label: entityKindLabels[key] }))]}
          />
          <DateFilter label="Desde" value={from} onChange={update(setFrom)} />
          <DateFilter label="Hasta" value={to} onChange={update(setTo)} />
        </FilterBar>

        {list.error && <ErrorState description={list.error.message} onRetry={list.reload} />}
        {list.loading && !list.data && <LoadingState rows={5} />}
        {list.data && list.data.items.length === 0 && (
          <EmptyState title="No hay eventos con esos criterios" description="Probá ampliar el rango de fechas o quitar filtros." />
        )}
        {list.data && list.data.items.length > 0 && <AuditFeed events={list.data.items} />}

        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="eventos"
          />
        )}
      </Card>
    </PageContainer>
  )
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `audit-${label.toLowerCase()}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-2xs font-medium tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
      />
    </div>
  )
}

/** Events grouped by day; each row shows actor, action, entity and the before/after diff. */
function AuditFeed({ events }: { events: AuditListItem[] }) {
  const byDay = new Map<string, AuditListItem[]>()
  for (const event of events) {
    const day = event.at.slice(0, 10)
    byDay.set(day, [...(byDay.get(day) ?? []), event])
  }

  return (
    <div className="divide-y divide-slate-200">
      {[...byDay.entries()].map(([day, items]) => (
        <section key={day} className="px-4 py-3">
          <h2 className="mb-2 text-2xs font-semibold tracking-wide text-slate-500 uppercase">{formatDate(day)}</h2>
          <ol className="space-y-2">
            {items.map((event) => {
              const href = entityHref(event.entityKind, event.entityId)
              return (
                <li key={event.id} className="flex gap-3 rounded-md border border-slate-200 bg-white px-3 py-2.5">
                  <Avatar name={event.userName} color={event.avatarColor} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-slate-900">{event.userName}</span>
                      <span className="text-2xs text-slate-500">{userRoleLabels[event.userRole as UserRole]}</span>
                      <Badge>{auditActionLabels[event.action]}</Badge>
                      <Badge tone="info">{entityKindLabels[event.entityKind]}</Badge>
                      <time className="ml-auto text-2xs tabular-nums text-slate-400" dateTime={event.at}>
                        {formatDateTime(event.at)}
                      </time>
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{event.summary}</p>
                    <p className="text-xs text-slate-500">
                      {href ? (
                        <Link to={href} className="hover:text-brand-700 hover:underline">
                          {event.entityLabel}
                        </Link>
                      ) : (
                        event.entityLabel
                      )}
                    </p>
                    {event.changes && event.changes.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {event.changes.map((change) => (
                          <li
                            key={change.field}
                            className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                          >
                            <span className="font-medium text-slate-600">{change.field}:</span>
                            <span className="text-slate-500 line-through">{change.before}</span>
                            <ArrowRight className="size-3 text-slate-400" aria-hidden="true" />
                            <span className="font-medium text-slate-900">{change.after}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
