import { CalendarClock, ChevronRight } from 'lucide-react'
import { useState, type DragEvent } from 'react'
import { Avatar, ErrorState, LoadingState, StatusBadge } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatRelativeDate } from '@/lib/format'
import { leadPriorityMeta, leadStageMeta, leadStageOrder } from '@/lib/labels'
import { DEMO_TODAY } from '@/mocks/db'
import type { LeadBoardColumn, LeadListItem } from '@/services'
import type { LeadStage } from '@/types'

export interface LeadBoardProps {
  columns: LeadBoardColumn[] | undefined
  loading: boolean
  error?: Error
  onRetry: () => void
  onSelect: (id: string) => void
  /** Absent when the current role cannot change stages. */
  onMove?: (id: string, stage: LeadStage) => void
}

const DRAG_TYPE = 'application/x-inverhome-lead'

/**
 * Kanban with one column per stage (spec section 10). Cards can be dragged
 * between columns or advanced with the arrow button, which is also the
 * keyboard path.
 */
export function LeadBoard({ columns, loading, error, onRetry, onSelect, onMove }: LeadBoardProps) {
  const [dragOver, setDragOver] = useState<LeadStage | undefined>()

  if (error) return <ErrorState description={error.message} onRetry={onRetry} />
  if (loading && !columns) return <LoadingState rows={4} />
  if (!columns) return null

  function onDragStart(event: DragEvent, lead: LeadListItem) {
    event.dataTransfer.setData(DRAG_TYPE, lead.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  function onDrop(event: DragEvent, stage: LeadStage) {
    event.preventDefault()
    setDragOver(undefined)
    const id = event.dataTransfer.getData(DRAG_TYPE)
    if (id && onMove) onMove(id, stage)
  }

  return (
    <div className="app-scrollbar overflow-x-auto">
      <div className="flex min-w-max gap-3 p-4" role="list" aria-label="Tablero de leads por etapa">
        {columns.map((column) => {
          const meta = leadStageMeta[column.stage]
          const stageIndex = leadStageOrder.indexOf(column.stage)
          const nextStage = leadStageOrder[stageIndex + 1]
          const canAdvance = nextStage && nextStage !== 'lost'
          return (
            <section
              key={column.stage}
              role="listitem"
              aria-label={`${meta.label}: ${column.items.length} leads`}
              onDragOver={(event) => {
                if (!onMove) return
                event.preventDefault()
                setDragOver(column.stage)
              }}
              onDragLeave={() => setDragOver(undefined)}
              onDrop={(event) => onDrop(event, column.stage)}
              className={cn(
                'flex w-64 shrink-0 flex-col rounded-lg border bg-slate-50 transition-colors',
                dragOver === column.stage ? 'border-brand-400 bg-brand-50/40' : 'border-slate-200',
              )}
            >
              <header className="flex items-center justify-between px-3 py-2">
                <StatusBadge meta={meta} />
                <span className="text-xs font-medium tabular-nums text-slate-500">{column.items.length}</span>
              </header>
              <ul className="flex flex-1 flex-col gap-2 px-2 pb-2">
                {column.items.length === 0 && (
                  <li className="rounded-md border border-dashed border-slate-200 px-3 py-6 text-center text-2xs text-slate-400">
                    Sin leads
                  </li>
                )}
                {column.items.map((lead) => (
                  <li
                    key={lead.id}
                    draggable={Boolean(onMove)}
                    onDragStart={(event) => onDragStart(event, lead)}
                    className={cn(
                      'group rounded-md border border-slate-200 bg-white p-2.5 shadow-sm',
                      onMove && 'cursor-grab active:cursor-grabbing',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(lead.id)}
                      className="flex w-full flex-col items-start gap-1.5 text-left"
                    >
                      <span className="flex w-full items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-900">{lead.personName}</span>
                        <StatusBadge meta={leadPriorityMeta[lead.priority]} showIcon={false} />
                      </span>
                      <span className="line-clamp-2 text-xs text-slate-600">{lead.propertyLabel}</span>
                      <span className="flex w-full items-center gap-1.5 text-2xs text-slate-500">
                        <Avatar name={lead.agentName} color="bg-slate-400" />
                        <span className="truncate">{lead.agentName}</span>
                        {lead.nextContactAt && (
                          <span className="ml-auto flex items-center gap-1">
                            <CalendarClock className="size-3" aria-hidden="true" />
                            {formatRelativeDate(lead.nextContactAt, new Date(DEMO_TODAY))}
                          </span>
                        )}
                      </span>
                    </button>
                    {onMove && canAdvance && (
                      <button
                        type="button"
                        onClick={() => onMove(lead.id, nextStage)}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-slate-200 py-1 text-2xs font-medium text-slate-500 opacity-70 transition-opacity hover:bg-slate-50 hover:text-slate-800 group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        Mover a {leadStageMeta[nextStage].label}
                        <ChevronRight className="size-3" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
