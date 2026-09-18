import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface StepperStep {
  id: string
  label: string
}

export interface StepperProps {
  steps: StepperStep[]
  /** Index of the current step; every earlier step renders as completed. */
  currentIndex: number
  /** Cancelled pipelines are shown greyed out with no current step. */
  cancelled?: boolean
  className?: string
}

export function Stepper({ steps, currentIndex, cancelled, className }: StepperProps) {
  return (
    <ol className={cn('app-scrollbar flex items-center gap-1 overflow-x-auto', className)}>
      {steps.map((step, index) => {
        const isDone = !cancelled && index < currentIndex
        const isCurrent = !cancelled && index === currentIndex
        return (
          <li key={step.id} className="flex shrink-0 items-center gap-1">
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2 py-1 text-2xs font-medium',
                isCurrent && 'border-brand-300 bg-brand-50 text-brand-800',
                isDone && 'border-emerald-200 bg-emerald-50 text-emerald-800',
                !isCurrent && !isDone && 'border-slate-200 bg-white text-slate-400',
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {isDone ? (
                <Check className="size-3" aria-hidden="true" />
              ) : (
                <span className="tabular-nums">{index + 1}</span>
              )}
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <span className="h-px w-3 bg-slate-200" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
