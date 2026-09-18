import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

export interface AvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md'
  className?: string
}

export function Avatar({ name, color = 'bg-slate-500', size = 'sm', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' ? 'size-6 text-2xs' : 'size-9 text-xs',
        color,
        className,
      )}
      aria-hidden="true"
      title={name}
    >
      {initials(name)}
    </span>
  )
}
