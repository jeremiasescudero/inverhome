import { KanbanSquare, List } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { leadPriorityMeta, leadSourceLabels, leadStageMeta } from '@/lib/labels'
import { leadsService, usersService } from '@/services'
import type { LeadFilters, LeadPriority, LeadSource, LeadStage } from '@/types'
import { LeadBoard } from './LeadBoard'
import { LeadDrawer } from './LeadDrawer'
import { LeadList } from './LeadList'

type ViewMode = 'board' | 'list'

export function LeadsPage() {
  const { user, can } = useSession()
  const { notify } = useToast()
  const [view, setView] = useState<ViewMode>('board')
  const [search, setSearch] = useState('')
  const [stage, setStage] = useState('all')
  const [priority, setPriority] = useState('all')
  const [agentId, setAgentId] = useState('all')
  const [source, setSource] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<LeadFilters>(
    () => ({
      search: debouncedSearch,
      stage: stage as LeadStage | 'all',
      priority: priority as LeadPriority | 'all',
      agentId,
      source: source as LeadSource | 'all',
    }),
    [debouncedSearch, stage, priority, agentId, source],
  )

  const board = useAsync(() => leadsService.board(filters), [filters, view])
  const list = useAsync(() => leadsService.list(filters, { page, pageSize: 15 }), [filters, page, view])
  const agents = useAsync(() => usersService.agents(), [])

  const canManage = can('leads.manage')

  async function moveLead(id: string, nextStage: LeadStage) {
    try {
      await leadsService.changeStage(id, nextStage, user.id)
      notify({ title: 'Etapa actualizada', description: `Lead movido a ${leadStageMeta[nextStage].label}.` })
      board.reload()
      list.reload()
    } catch (cause) {
      notify({ title: 'No se pudo mover el lead', description: (cause as Error).message, tone: 'error' })
    }
  }

  const activeCount = [stage, priority, agentId, source].filter((value) => value !== 'all').length

  function update(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <PageContainer wide={view === 'board'}>
      <PageHeader
        title="Leads"
        description="Oportunidades comerciales desde la primera consulta hasta la conversión."
        actions={
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="Modo de vista">
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
              className={cn('h-7', view === 'board' && 'bg-slate-100 text-slate-900')}
              icon={<KanbanSquare className="size-3.5" aria-hidden="true" />}
            >
              Kanban
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={cn('h-7', view === 'list' && 'bg-slate-100 text-slate-900')}
              icon={<List className="size-3.5" aria-hidden="true" />}
            >
              Listado
            </Button>
          </div>
        }
      />

      <Card>
        <FilterBar
          lead={
            <SearchInput
              value={search}
              onChange={update(setSearch)}
              placeholder="Buscar por código, cliente o propiedad…"
            />
          }
          onClear={() => {
            setStage('all')
            setPriority('all')
            setAgentId('all')
            setSource('all')
            setPage(1)
          }}
          activeCount={activeCount}
        >
          {view === 'list' && (
            <FilterSelect
              label="Etapa"
              value={stage}
              onChange={update(setStage)}
              options={[
                { value: 'all', label: 'Todas' },
                ...(Object.keys(leadStageMeta) as LeadStage[]).map((key) => ({
                  value: key,
                  label: leadStageMeta[key].label,
                })),
              ]}
            />
          )}
          <FilterSelect
            label="Prioridad"
            value={priority}
            onChange={update(setPriority)}
            options={[
              { value: 'all', label: 'Todas' },
              ...(Object.keys(leadPriorityMeta) as LeadPriority[]).map((key) => ({
                value: key,
                label: leadPriorityMeta[key].label,
              })),
            ]}
          />
          <FilterSelect
            label="Origen"
            value={source}
            onChange={update(setSource)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(leadSourceLabels) as LeadSource[]).map((key) => ({
                value: key,
                label: leadSourceLabels[key],
              })),
            ]}
          />
          <FilterSelect
            label="Agente"
            value={agentId}
            onChange={update(setAgentId)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(agents.data ?? []).map((agent) => ({ value: agent.id, label: agent.name })),
            ]}
          />
        </FilterBar>

        {view === 'board' ? (
          <LeadBoard
            columns={board.data}
            loading={board.loading}
            error={board.error}
            onRetry={board.reload}
            onSelect={setSelectedId}
            onMove={canManage ? moveLead : undefined}
          />
        ) : (
          <LeadList
            page={list.data}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            onPageChange={setPage}
            onSelect={setSelectedId}
          />
        )}
      </Card>

      <LeadDrawer
        leadId={selectedId}
        onClose={() => setSelectedId(undefined)}
        onMove={canManage ? moveLead : undefined}
      />
    </PageContainer>
  )
}
