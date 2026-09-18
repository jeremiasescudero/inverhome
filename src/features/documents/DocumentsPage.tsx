import { CalendarClock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ErrorState,
  FileCard,
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
import { formatDate } from '@/lib/format'
import { documentStatusMeta, documentTypeLabels, entityKindLabels } from '@/lib/labels'
import { documentsService } from '@/services'
import type { DocumentFilters, DocumentStatus, DocumentType, EntityKind } from '@/types'

const ENTITY_KINDS: EntityKind[] = ['property', 'client', 'operation', 'rental']

export function DocumentsPage() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState(params.get('estado') ?? 'all')
  const [entityKind, setEntityKind] = useState('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search)

  const filters = useMemo<DocumentFilters>(
    () => ({
      search: debouncedSearch,
      type: type as DocumentType | 'all',
      status: status as DocumentStatus | 'all',
      entityKind: entityKind as EntityKind | 'all',
    }),
    [debouncedSearch, type, status, entityKind],
  )

  const list = useAsync(() => documentsService.list(filters, { page }), [filters, page])
  const expiring = useAsync(() => documentsService.expiring(), [])

  function update(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Documentos"
        description="Documentación centralizada de propiedades, clientes, operaciones y contratos."
      />

      {expiring.data && expiring.data.length > 0 && (
        <Card>
          <CardHeader
            title="Vencimientos próximos"
            description="Documentos que vencen en los próximos 45 días o ya vencieron."
          />
          <CardBody className="px-0 py-0">
            <ul className="divide-y divide-slate-100">
              {expiring.data.map((document) => (
                <li key={document.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <CalendarClock className="size-4 text-amber-700" aria-hidden="true" />
                  <span className="text-sm font-medium text-slate-900">{document.name}</span>
                  <span className="text-xs text-slate-500">{document.entityLabel}</span>
                  <span className="ml-auto text-xs text-slate-600">Vence {formatDate(document.expiresAt)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <FilterBar
          lead={<SearchInput value={search} onChange={update(setSearch)} placeholder="Buscar por nombre o entidad…" />}
          onClear={() => {
            setType('all')
            setStatus('all')
            setEntityKind('all')
            setPage(1)
          }}
          activeCount={[type, status, entityKind].filter((value) => value !== 'all').length}
        >
          <FilterSelect
            label="Tipo"
            value={type}
            onChange={update(setType)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(documentTypeLabels) as DocumentType[]).map((key) => ({
                value: key,
                label: documentTypeLabels[key],
              })),
            ]}
          />
          <FilterSelect
            label="Estado"
            value={status}
            onChange={update(setStatus)}
            options={[
              { value: 'all', label: 'Todos' },
              ...(Object.keys(documentStatusMeta) as DocumentStatus[]).map((key) => ({
                value: key,
                label: documentStatusMeta[key].label,
              })),
            ]}
          />
          <FilterSelect
            label="Entidad"
            value={entityKind}
            onChange={update(setEntityKind)}
            options={[
              { value: 'all', label: 'Todas' },
              ...ENTITY_KINDS.map((kind) => ({ value: kind, label: entityKindLabels[kind] })),
            ]}
          />
        </FilterBar>

        {list.error && <ErrorState description={list.error.message} onRetry={list.reload} />}
        {list.loading && !list.data && <LoadingState rows={4} />}
        {list.data && list.data.items.length === 0 && (
          <EmptyState title="No hay documentos con esos criterios" description="Probá ajustar la búsqueda o los filtros." />
        )}
        {list.data && list.data.items.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.data.items.map((document) => (
              <li key={document.id}>
                <FileCard document={document} uploadedByName={document.uploadedByName} />
              </li>
            ))}
          </ul>
        )}
        {list.data && (
          <Pagination
            page={list.data.page}
            pageSize={list.data.pageSize}
            total={list.data.total}
            onPageChange={setPage}
            itemLabel="documentos"
          />
        )}
      </Card>
    </PageContainer>
  )
}
