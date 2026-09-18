import { Bath, BedDouble, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, EmptyState, ErrorState, ImagePlaceholder, LoadingState, StatusBadge } from '@/components/ui'
import { formatArea, formatMoney } from '@/lib/format'
import { operationKindLabels, propertyStatusMeta, propertyTypeLabels } from '@/lib/labels'
import type { PropertyListItem } from '@/services'

export interface PropertyCardGridProps {
  rows: PropertyListItem[]
  loading: boolean
  error?: Error
  onRetry: () => void
}

export function PropertyCardGrid({ rows, loading, error, onRetry }: PropertyCardGridProps) {
  if (error) return <ErrorState description={error.message} onRetry={onRetry} />
  if (loading) return <LoadingState rows={3} />
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No hay propiedades con esos criterios"
        description="Probá ajustar la búsqueda o los filtros aplicados."
      />
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            to={`/propiedades/${row.id}`}
            className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-brand-300"
          >
            <ImagePlaceholder caption={row.coverImage} seed={row.id} className="h-36 w-full" />
            <div className="flex flex-1 flex-col gap-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{row.title}</p>
                  <p className="truncate text-xs text-slate-500">{row.address}</p>
                </div>
                <StatusBadge meta={propertyStatusMeta[row.status]} />
              </div>
              <p className="text-base font-semibold tabular-nums text-slate-900">
                {formatMoney(row.price)}
                {row.rentPrice && (
                  <span className="ml-1 text-xs font-normal text-slate-500">
                    · {formatMoney(row.rentPrice)} / mes
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>{operationKindLabels[row.operation]}</Badge>
                <Badge>{propertyTypeLabels[row.type]}</Badge>
                {!row.published && <Badge tone="attention">Sin publicar</Badge>}
              </div>
              <dl className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Ruler className="size-3.5" aria-hidden="true" />
                  <dt className="sr-only">Superficie</dt>
                  <dd>{formatArea(row.totalArea)}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <BedDouble className="size-3.5" aria-hidden="true" />
                  <dt className="sr-only">Dormitorios</dt>
                  <dd>{row.bedrooms}</dd>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="size-3.5" aria-hidden="true" />
                  <dt className="sr-only">Ambientes</dt>
                  <dd>{row.rooms} amb.</dd>
                </div>
                <span className="ml-auto truncate">{row.agentName}</span>
              </dl>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
