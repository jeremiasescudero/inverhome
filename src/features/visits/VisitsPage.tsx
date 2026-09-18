import { CalendarDays, List } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Button,
  Card,
  FilterBar,
  FilterSelect,
  PageContainer,
  PageHeader,
  SearchInput,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import { visitStatusMeta } from '@/lib/labels'
import { usersService, visitsService } from '@/services'
import type { VisitFilters, VisitStatus } from '@/types'
import { VisitAgenda } from './VisitAgenda'
import { VisitDrawer } from './VisitDrawer'
import { VisitList } from './VisitList'

type ViewMode = 'agenda' | 'list'

export function VisitsPage() {
  const { user, can } = useSession()
  const { notify } = useToast()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<ViewMode>('agenda')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [agentId, setAgentId] = useState('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const selectedId = params.get('visita') ?? undefined

  const filters = useMemo<VisitFilters>(
    () => ({ search: debouncedSearch, status: status as VisitStatus | 'all', agentId }),
    [debouncedSearch, status, agentId],
  )

  const agenda = useAsync(() => visitsService.agenda(filters), [filters, view])
  const list = useAsync(() => visitsService.list(filters, { page, pageSize: 15 }), [filters, page, view])
  const agents = useAsync(() => usersService.agents(), [])

  function select(id: string | undefined) {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (id) next.set('visita', id)
      else next.delete('visita')
      return next
    })
  }

  async function changeStatus(id: string, next: VisitStatus) {
    try {
      await visitsService.changeStatus(id, next, user.id)
      notify({ title: 'Visita actualizada', description: `Estado: ${visitStatusMeta[next].label}.` })
      agenda.reload()
      list.reload()
    } catch (cause) {
      notify({ title: 'No se pudo actualizar la visita', description: (cause as Error).message, tone: 'error' })
    }
  }

  const activeCount = [status, agentId].filter((value) => value !== 'all').length

  return (
    <PageContainer>
      <PageHeader
        title="Visitas"
        description="Agenda de visitas a propiedades y su resultado."
        actions={
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="Modo de vista">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={view === 'agenda'}
              onClick={() => setView('agenda')}
              className={cn('h-7', view === 'agenda' && 'bg-slate-100 text-slate-900')}
              icon={<CalendarDays className="size-3.5" aria-hidden="true" />}
            >
              Agenda
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={cn('h-7', view === 'list' && 'bg-slate-100 text-slate-900')}
              icon={<List className="size-3.5" aria-hidden="true" />}
            >
              Historial
            </Button>
          </div>
        }
      />

      <Card>
        <FilterBar
          lead={
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
              placeholder="Buscar por propiedad, cliente o código…"
            />
          }
          onClear={() => {
            setStatus('all')
            setAgentId('all')
            setPage(1)
          }}
          activeCount={activeCount}
        >
          <FilterSelect
            label="Estado"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(visitStatusMeta) as VisitStatus[]).map((key) => ({
                value: key,
                label: visitStatusMeta[key].label,
              })),
            ]}
          />
          <FilterSelect
            label="Agente"
            value={agentId}
            onChange={(value) => {
              setAgentId(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(agents.data ?? []).map((agent) => ({ value: agent.id, label: agent.name })),
            ]}
          />
        </FilterBar>

        {view === 'agenda' ? (
          <VisitAgenda
            days={agenda.data}
            loading={agenda.loading}
            error={agenda.error}
            onRetry={agenda.reload}
            onSelect={select}
          />
        ) : (
          <VisitList
            page={list.data}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            onPageChange={setPage}
            onSelect={select}
          />
        )}
      </Card>

      <VisitDrawer
        visitId={selectedId}
        onClose={() => select(undefined)}
        onChangeStatus={can('visits.manage') ? changeStatus : undefined}
      />
    </PageContainer>
  )
}
