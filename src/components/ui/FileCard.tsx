import { Download, FileText, Image as ImageIcon, Paperclip } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/format'
import { documentStatusMeta, documentTypeLabels } from '@/lib/labels'
import type { StoredDocument } from '@/types'
import { Badge, StatusBadge } from './Badge'

export interface FileCardProps {
  document: StoredDocument
  uploadedByName?: string
  /** The demo has no real storage, so downloads are explicitly disabled. */
  onOpen?: (document: StoredDocument) => void
}

export function FileCard({ document, uploadedByName, onOpen }: FileCardProps) {
  const Icon =
    document.format === 'jpg' || document.format === 'png'
      ? ImageIcon
      : document.format === 'pdf'
        ? FileText
        : Paperclip

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900" title={document.name}>
            {document.name}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{document.entityLabel}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{documentTypeLabels[document.type]}</Badge>
        <StatusBadge meta={documentStatusMeta[document.status]} />
        <Badge className="uppercase">{document.format}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs text-slate-500">
        <div>
          <dt className="inline">Cargado: </dt>
          <dd className="inline">{formatDate(document.uploadedAt)}</dd>
        </div>
        {document.expiresAt && (
          <div>
            <dt className="inline">Vence: </dt>
            <dd className="inline">{formatDate(document.expiresAt)}</dd>
          </div>
        )}
        {uploadedByName && (
          <div className="col-span-2 truncate">
            <dt className="inline">Por: </dt>
            <dd className="inline">{uploadedByName}</dd>
          </div>
        )}
        <div>
          <dt className="inline">Tamaño: </dt>
          <dd className="inline">
            {document.sizeKb > 0 ? `${formatNumber(document.sizeKb)} KB` : 'Pendiente'}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={() => onOpen?.(document)}
        disabled={!onOpen}
        className="mt-auto inline-flex items-center gap-1.5 self-start rounded border border-slate-300 px-2 py-1 text-2xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        title={onOpen ? undefined : 'La demo no incluye almacenamiento real de archivos'}
      >
        <Download className="size-3" aria-hidden="true" />
        Ver documento
      </button>
    </article>
  )
}
