import { AlertCircle, Inbox, RotateCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="size-5" aria-hidden="true" />}
      </span>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'No pudimos cargar la información',
  description,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-500">{description}</p>}
      {onRetry && (
        <Button
          className="mt-2"
          size="sm"
          onClick={onRetry}
          icon={<RotateCw className="size-3.5" aria-hidden="true" />}
        >
          Reintentar
        </Button>
      )}
    </div>
  )
}

/** Neutral placeholder block used while data is in flight. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-slate-200/70', className)} />
}

export function LoadingState({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2 px-4 py-4', className)} aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando información</span>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-9 w-full" />
      ))}
    </div>
  )
}
