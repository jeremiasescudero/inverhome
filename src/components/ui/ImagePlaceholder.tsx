import { Building2, ImageOff } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * The demo ships no binary assets and makes no network requests, so property
 * photos are deterministic local placeholders: the same caption always yields
 * the same shade, which keeps galleries visually stable between renders.
 */
const SHADES = [
  'from-slate-200 to-slate-300',
  'from-stone-200 to-stone-300',
  'from-sky-100 to-sky-200',
  'from-emerald-100 to-emerald-200',
  'from-amber-100 to-amber-200',
  'from-indigo-100 to-indigo-200',
]

function shadeFor(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 997
  }
  return SHADES[hash % SHADES.length]
}

export interface ImagePlaceholderProps {
  caption?: string
  seed?: string
  className?: string
  showCaption?: boolean
}

export function ImagePlaceholder({
  caption,
  seed,
  className,
  showCaption = true,
}: ImagePlaceholderProps) {
  const hasCaption = Boolean(caption)
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br',
        shadeFor(seed ?? caption ?? 'sin-foto'),
        className,
      )}
      role="img"
      aria-label={caption ? `Imagen de referencia: ${caption}` : 'Sin fotos disponibles'}
    >
      {hasCaption ? (
        <Building2 className="size-6 text-white/70" aria-hidden="true" />
      ) : (
        <ImageOff className="size-5 text-slate-400" aria-hidden="true" />
      )}
      {showCaption && (
        <span className="absolute bottom-1 left-1 rounded bg-slate-900/55 px-1.5 py-0.5 text-2xs font-medium text-white">
          {caption ?? 'Sin fotos'}
        </span>
      )}
    </div>
  )
}
