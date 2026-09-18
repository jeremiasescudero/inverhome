import { Avatar, Badge, DataTable, ImagePlaceholder, StatusBadge, type Column, type SortState } from '@/components/ui'
import { formatDate, formatMoney } from '@/lib/format'
import { operationKindLabels, propertyStatusMeta, propertyTypeLabels } from '@/lib/labels'
import type { PropertyListItem } from '@/services'

export interface PropertyTableProps {
  rows: PropertyListItem[]
  loading: boolean
  error?: Error
  onRetry: () => void
  sort: SortState
  onSortChange: (sort: SortState) => void
}

const columns: Column<PropertyListItem>[] = [
  {
    key: 'code',
    header: 'Propiedad',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <ImagePlaceholder
          caption={row.coverImage}
          seed={row.id}
          showCaption={false}
          className="size-10 shrink-0 rounded-md"
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{row.title}</p>
          <p className="truncate text-xs text-slate-500">
            {row.code} · {row.address}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: 'operation',
    header: 'Operación',
    hideBelow: 'md',
    render: (row) => (
      <div className="flex flex-col gap-0.5">
        <span>{operationKindLabels[row.operation]}</span>
        <span className="text-xs text-slate-500">{propertyTypeLabels[row.type]}</span>
      </div>
    ),
  },
  {
    key: 'price',
    header: 'Precio',
    sortable: true,
    align: 'right',
    render: (row) => (
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-medium tabular-nums text-slate-900">{formatMoney(row.price)}</span>
        {row.rentPrice && (
          <span className="text-xs tabular-nums text-slate-500">{formatMoney(row.rentPrice)} / mes</span>
        )}
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Estado',
    sortable: true,
    render: (row) => (
      <div className="flex flex-wrap items-center gap-1">
        <StatusBadge meta={propertyStatusMeta[row.status]} />
        {!row.published && <Badge>Sin publicar</Badge>}
      </div>
    ),
  },
  {
    key: 'agentName',
    header: 'Agente',
    sortable: true,
    hideBelow: 'lg',
    render: (row) => (
      <span className="flex items-center gap-2">
        <Avatar name={row.agentName} color="bg-slate-500" />
        <span className="truncate">{row.agentName}</span>
      </span>
    ),
  },
  {
    key: 'updatedAt',
    header: 'Actualizada',
    sortable: true,
    hideBelow: 'xl',
    render: (row) => <span className="text-slate-500">{formatDate(row.updatedAt)}</span>,
  },
]

export function PropertyTable({ rows, loading, error, onRetry, sort, onSortChange }: PropertyTableProps) {
  return (
    <DataTable
      caption="Listado de propiedades"
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      rowHref={(row) => `/propiedades/${row.id}`}
      sort={sort}
      onSortChange={onSortChange}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No hay propiedades con esos criterios"
    />
  )
}
