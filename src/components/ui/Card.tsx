import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white', className)}>
      {children}
    </section>
  )
}

export interface CardHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-4 py-3', className)}>{children}</div>
}
