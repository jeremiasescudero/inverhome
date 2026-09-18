import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface PageContainerProps {
  children: ReactNode
  className?: string
  /** Wide pages (kanban, agenda) can opt out of the default max width. */
  wide?: boolean
}

/** Consistent page gutter and vertical rhythm for every feature screen. */
export function PageContainer({ children, className, wide }: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:px-6',
        wide ? 'max-w-[110rem]' : 'max-w-7xl',
        className,
      )}
    >
      {children}
    </main>
  )
}
