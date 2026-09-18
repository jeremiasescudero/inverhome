import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '@/app/SessionContext'
import { useToast } from '@/app/ToastContext'
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  FilterBar,
  FilterSelect,
  PageContainer,
  PageHeader,
  Pagination,
  SearchInput,
  StatusBadge,
  type Column,
} from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { formatDate, formatDateTime, formatNumber } from '@/lib/format'
import { userRoleLabels, userStatusMeta } from '@/lib/labels'
import { usersService, type UserFilters, type UserListItem } from '@/services'
import type { UserRole, UserStatus } from '@/types'
import { UserDrawer } from './UserDrawer'
import { UserFormModal } from './UserFormModal'

export function UsersPage() {
  const { user: sessionUser, can } = useSession()
  const { notify } = useToast()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [creating, setCreating] = useState(false)
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<UserFilters>(
    () => ({ search: debouncedSearch, role: role as UserRole | 'all', status: status as UserStatus | 'all' }),
    [debouncedSearch, role, status],
  )
  const list = useAsync(() => usersService.list(filters, { page }), [filters, page])
  const canManage = can('users.manage')

  async function changeRole(id: string, next: UserRole) {
    try {
      await usersService.changeRole(id, next, sessionUser.id)
      notify({ title: 'Rol actualizado', description: `Nuevo rol: ${userRoleLabels[next]}.` })
      list.reload()
    } catch (cause) {
      notify({ title: 'No se pudo cambiar el rol', description: (cause as Error).message, tone: 'error' })
    }
  }

  async function changeStatus(id: string, next: UserStatus) {
    try {
      await usersService.changeStatus(id, next, sessionUser.id)
      notify({ title: 'Estado actualizado', description: `Usuario ${userStatusMeta[next].label.toLowerCase()}.` })
      list.reload()
    } catch (cause) {
      notify({ title: 'No se pudo cambiar el estado', description: (cause as Error).message, tone: 'error' })
    }
  }

  const columns: Column<UserListItem>[] = [
    {
      key: 'name',
      header: 'Usuario',
      render: (row) => (
        <span className="flex items-center gap-2.5">
          <Avatar name={row.name} color={row.avatarColor} size="md" />
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900">
              {row.name}
              {row.id === sessionUser.id && <span className="ml-1.5 text-2xs text-slate-400">(vos)</span>}
            </span>
            <span className="block truncate text-xs text-slate-500">{row.email}</span>
          </span>
        </span>
      ),
    },
    { key: 'role', header: 'Rol', render: (row) => <Badge tone="info">{userRoleLabels[row.role]}</Badge> },
    { key: 'status', header: 'Estado', render: (row) => <StatusBadge meta={userStatusMeta[row.status]} /> },
    {
      key: 'portfolio',
      header: 'Cartera',
      hideBelow: 'lg',
      render: (row) =>
        row.isAgent ? (
          <span className="text-xs text-slate-600">
            {formatNumber(row.assignedProperties)} propiedades · {formatNumber(row.openLeads)} leads abiertos
          </span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'lastAccess',
      header: 'Último acceso',
      hideBelow: 'md',
      render: (row) => <span className="text-slate-600">{formatDateTime(row.lastAccessAt)}</span>,
    },
    {
      key: 'createdAt',
      header: 'Alta',
      hideBelow: 'xl',
      render: (row) => <span className="text-slate-500">{formatDate(row.createdAt)}</span>,
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Usuarios"
        description="Personal de la inmobiliaria, roles y estado de acceso."
        actions={
          canManage && (
            <Button variant="primary" onClick={() => setCreating(true)} icon={<Plus className="size-4" aria-hidden="true" />}>
              Nuevo usuario
            </Button>
          )
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
              placeholder="Buscar por nombre o email…"
            />
          }
          onClear={() => {
            setRole('all')
            setStatus('all')
            setPage(1)
          }}
          activeCount={[role, status].filter((value) => value !== 'all').length}
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
              ...(Object.keys(userRoleLabels) as UserRole[]).map((key) => ({ value: key, label: userRoleLabels[key] })),
            ]}
          />
          <FilterSelect
            label="Estado"
            value={status}
            onChange={(value) => {
              setStatus(value)
              setPage(1)
            }}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(userStatusMeta) as UserStatus[]).map((key) => ({ value: key, label: userStatusMeta[key].label })),
            ]}
          />
        </FilterBar>

        <DataTable
          caption="Listado de usuarios"
          columns={columns}
          rows={list.data?.items ?? []}
          getRowId={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          loading={list.loading}
          error={list.error}
          onRetry={list.reload}
          emptyTitle="No hay usuarios con esos criterios"
        />
        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="usuarios"
          />
        )}
      </Card>

      <UserDrawer
        userId={selectedId}
        onClose={() => setSelectedId(undefined)}
        onChangeRole={canManage ? changeRole : undefined}
        onChangeStatus={canManage ? changeStatus : undefined}
        isSelf={selectedId === sessionUser.id}
      />
      <UserFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false)
          list.reload()
        }}
      />
    </PageContainer>
  )
}
