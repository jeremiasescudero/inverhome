import { useMemo, useState } from 'react'
import {
  Avatar,
  Badge,
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  type Column,
  type SortState,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { formatDate, formatNumber } from '@/lib/format'
import { personRoleLabels } from '@/lib/labels'
import { clientsService, type ClientListItem } from '@/services'
import type { PersonRole } from '@/types'

const columns: Column<ClientListItem>[] = [
  {
    key: 'name',
    header: 'Cliente',
    sortable: true,
    render: (row) => (
      <span className="flex items-center gap-2.5">
        <Avatar name={row.name} color="bg-slate-500" size="md" />
        <span className="min-w-0">
          <span className="block truncate font-medium text-slate-900">{row.name}</span>
          <span className="block text-xs text-slate-500">{row.document}</span>
        </span>
      </span>
    ),
  },
  {
    key: 'contact',
    header: 'Contacto',
    hideBelow: 'md',
    render: (row) => (
      <span className="flex flex-col gap-0.5">
        <span>{row.phone}</span>
        <span className="truncate text-xs text-slate-500">{row.email}</span>
      </span>
    ),
  },
  {
    key: 'roles',
    header: 'Roles',
    render: (row) => (
      <span className="flex flex-wrap gap-1">
        {row.roles.map((role) => (
          <Badge key={role}>{personRoleLabels[role]}</Badge>
        ))}
      </span>
    ),
  },
  {
    key: 'propertiesCount',
    header: 'Propiedades',
    sortable: true,
    align: 'right',
    hideBelow: 'lg',
    render: (row) => <span className="tabular-nums">{formatNumber(row.propertiesCount)}</span>,
  },
  {
    key: 'operationsCount',
    header: 'Operaciones',
    align: 'right',
    hideBelow: 'lg',
    render: (row) => <span className="tabular-nums">{formatNumber(row.operationsCount)}</span>,
  },
  {
    key: 'lastActivityAt',
    header: 'Última actividad',
    sortable: true,
    hideBelow: 'xl',
    render: (row) => <span className="text-slate-500">{formatDate(row.lastActivityAt)}</span>,
  },
]

export function ClientsPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>({ by: 'name', dir: 'asc' })
  const debouncedSearch = useDebounced(search)

  const filters = useMemo(
    () => ({ search: debouncedSearch, role: role as PersonRole | 'all' }),
    [debouncedSearch, role],
  )

  const list = useAsync(
    () => clientsService.list(filters, { page, pageSize: 10, sortBy: sort.by, sortDir: sort.dir }),
    [filters, page, sort.by, sort.dir],
  )

  return (
    <PageContainer>
      <PageHeader
        title="Clientes"
        description="Propietarios, compradores, inquilinos, garantes e inversores en un único registro."
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
              placeholder="Buscar por nombre, documento, teléfono o email…"
            />
          }
          onClear={() => {
            setRole('all')
            setPage(1)
          }}
          activeCount={role === 'all' ? 0 : 1}
        >
          <FilterSelect
            label="Rol"
            value={role}
            onChange={(value) => {
              setRole(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(personRoleLabels) as PersonRole[]).map((key) => ({
                value: key,
                label: personRoleLabels[key],
              })),
            ]}
          />
        </FilterBar>

        <DataTable
          caption="Listado de clientes"
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(row) => row.id}
          rowHref={(row) => `/clientes/${row.id}`}
          sort={sort}
          onSortChange={(next) => {
            setSort(next)
            setPage(1)
          }}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay clientes con esos criterios"
        />

        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="clientes"
          />
        )}
      </Card>
    </PageContainer>
  )
}
