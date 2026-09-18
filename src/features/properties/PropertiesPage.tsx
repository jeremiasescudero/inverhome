import { LayoutGrid, List, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import {
  Button,
  ButtonLink,
  Card,
  FilterBar,
  FilterNumber,
  FilterSelect,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  type SortState,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import { operationKindLabels, propertyStatusMeta, propertyTypeLabels } from '@/lib/labels'
import { propertiesService, usersService } from '@/services'
import type { OperationKind, PropertyFilters, PropertyStatus, PropertyType } from '@/types'
import { PropertyCardGrid } from './PropertyCardGrid'
import { PropertyTable } from './PropertyTable'

type ViewMode = 'table' | 'cards'

const PAGE_SIZE = 10

function optionsFrom<T extends string>(labels: Record<T, string>, allLabel: string) {
  return [
    { value: 'all', label: allLabel },
    ...(Object.keys(labels) as T[]).map((key) => ({ value: key, label: labels[key] })),
  ]
}

export function PropertiesPage() {
  const { can } = useSession()
  const [params] = useSearchParams()

  const [search, setSearch] = useState(params.get('q') ?? '')
  const [operation, setOperation] = useState(params.get('operacion') ?? 'all')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState(params.get('estado') ?? 'all')
  const [agentId, setAgentId] = useState('all')
  const [neighborhood, setNeighborhood] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRooms, setMinRooms] = useState('')
  const unpublishedOnly = params.get('publicadas') === 'no'
  const [view, setView] = useState<ViewMode>('table')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ by: 'updatedAt', dir: 'desc' })

  const debouncedSearch = useDebounced(search)

  const filters = useMemo<PropertyFilters>(
    () => ({
      search: debouncedSearch,
      operation: operation as OperationKind | 'all',
      type: type as PropertyType | 'all',
      status: status as PropertyStatus | 'all',
      agentId,
      neighborhood,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRooms: minRooms ? Number(minRooms) : undefined,
    }),
    [
      debouncedSearch,
      operation,
      type,
      status,
      agentId,
      neighborhood,
      minPrice,
      maxPrice,
      minRooms,
    ],
  )

  const filtersKey = JSON.stringify(filters)
  const list = useAsync(
    () =>
      propertiesService.list(filters, {
        page,
        pageSize: PAGE_SIZE,
        sortBy: sort.by,
        sortDir: sort.dir,
      }),
    [filtersKey, page, sort.by, sort.dir],
  )
  const agents = useAsync(() => usersService.agents(), [])
  const neighborhoods = useAsync(() => propertiesService.neighborhoods(), [])

  // The "sin publicar" alert deep-links here; the service has no such filter,
  // so it is applied on the page for the current results.
  const rows = useMemo(() => {
    const items = list.data?.items ?? []
    return unpublishedOnly ? items.filter((item) => !item.published) : items
  }, [list.data, unpublishedOnly])

  const activeCount = [
    operation !== 'all',
    type !== 'all',
    status !== 'all',
    agentId !== 'all',
    neighborhood !== 'all',
    minPrice !== '',
    maxPrice !== '',
    minRooms !== '',
  ].filter(Boolean).length

  function clearFilters() {
    setOperation('all')
    setType('all')
    setStatus('all')
    setAgentId('all')
    setNeighborhood('all')
    setMinPrice('')
    setMaxPrice('')
    setMinRooms('')
    setPage(1)
  }

  function update<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Propiedades"
        description="Cartera completa de la inmobiliaria: venta, alquiler, estado y agente responsable."
        actions={
          <>
            <div className="flex rounded-md border border-slate-300 bg-white p-0.5" role="group" aria-label="Modo de vista">
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={view === 'table'}
                onClick={() => setView('table')}
                className={cn('h-7', view === 'table' && 'bg-slate-100 text-slate-900')}
                icon={<List className="size-3.5" aria-hidden="true" />}
              >
                Tabla
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-pressed={view === 'cards'}
                onClick={() => setView('cards')}
                className={cn('h-7', view === 'cards' && 'bg-slate-100 text-slate-900')}
                icon={<LayoutGrid className="size-3.5" aria-hidden="true" />}
              >
                Cards
              </Button>
            </div>
            {(can('properties.manage') || can('properties.manage_own')) && (
              <ButtonLink
                to="/propiedades/nueva"
                variant="primary"
                icon={<Plus className="size-4" aria-hidden="true" />}
              >
                Nueva propiedad
              </ButtonLink>
            )}
          </>
        }
      />

      <Card>
        <FilterBar
          lead={
            <SearchInput
              value={search}
              onChange={update(setSearch)}
              placeholder="Buscar por código, título, barrio o calle…"
            />
          }
          onClear={clearFilters}
          activeCount={activeCount}
        >
          <FilterSelect
            label="Operación"
            value={operation}
            onChange={update(setOperation)}
            options={optionsFrom(operationKindLabels, 'Todas')}
          />
          <FilterSelect
            label="Tipo"
            value={type}
            onChange={update(setType)}
            options={optionsFrom(propertyTypeLabels, 'Todos')}
          />
          <FilterSelect
            label="Estado"
            value={status}
            onChange={update(setStatus)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(propertyStatusMeta) as PropertyStatus[]).map((key) => ({
                value: key,
                label: propertyStatusMeta[key].label,
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
          <FilterSelect
            label="Barrio"
            value={neighborhood}
            onChange={update(setNeighborhood)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(neighborhoods.data ?? []).map((name) => ({ value: name, label: name })),
            ]}
          />
          <FilterNumber label="Precio mín." value={minPrice} onChange={update(setMinPrice)} placeholder="0" />
          <FilterNumber label="Precio máx." value={maxPrice} onChange={update(setMaxPrice)} placeholder="∞" />
          <FilterNumber label="Ambientes" value={minRooms} onChange={update(setMinRooms)} placeholder="Mín." />
        </FilterBar>

        {view === 'table' ? (
          <PropertyTable
            rows={rows}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            sort={sort}
            onSortChange={(next) => {
              setSort(next)
              setPage(1)
            }}
          />
        ) : (
          <PropertyCardGrid rows={rows} loading={list.loading} error={list.error} onRetry={list.reload} />
        )}

        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="propiedades"
          />
        )}
      </Card>
    </PageContainer>
  )
}
