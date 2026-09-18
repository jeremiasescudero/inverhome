import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsync } from '@/hooks/useAsync'
import { useDebounced } from '@/hooks/useDebounced'
import { cn } from '@/lib/cn'
import { entityKindLabels } from '@/lib/labels'
import { searchService, type SearchHit } from '@/services'

/**
 * Header search across properties, clients, leads and operations (spec
 * section 26). Results are grouped by entity and navigable with the keyboard.
 */
export function GlobalSearch() {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  // The highlighted row is tied to the term it was chosen for, so a new
  // search starts at the top without an extra render.
  const [active, setActive] = useState({ term: '', index: 0 })
  const debounced = useDebounced(term, 200)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: groups, loading } = useAsync(() => searchService.query(debounced), [debounced])
  const flat: SearchHit[] = groups?.flatMap((group) => group.hits) ?? []
  const showPanel = open && debounced.trim().length >= 2
  const activeIndex = active.term === debounced ? active.index : 0
  const setActiveIndex = (update: number | ((index: number) => number)) =>
    setActive({ term: debounced, index: typeof update === 'function' ? update(activeIndex) : update })

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Ctrl/Cmd+K focuses the search from anywhere, as staff expect from SaaS tools.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  function go(hit: SearchHit) {
    setOpen(false)
    setTerm('')
    navigate(hit.href)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPanel || flat.length === 0) {
      if (event.key === 'Escape') setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % flat.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + flat.length) % flat.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(flat[activeIndex])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <Search
        className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-label="Búsqueda global"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-autocomplete="list"
        placeholder="Buscar propiedades, clientes, leads u operaciones…"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="h-9 w-full rounded-md border border-slate-300 bg-white pr-14 pl-8 text-sm text-slate-900 placeholder:text-slate-400"
      />
      <kbd
        className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1 py-0.5 font-sans text-2xs text-slate-400 sm:block"
        aria-hidden="true"
      >
        Ctrl K
      </kbd>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
        >
          {loading && flat.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-500">Buscando…</p>
          )}
          {!loading && flat.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-500">
              Sin resultados para “{debounced.trim()}”.
            </p>
          )}
          {groups?.map((group) => (
            <div key={group.kind} className="border-b border-slate-100 last:border-0">
              <p className="bg-slate-50 px-3 py-1 text-2xs font-semibold tracking-wide text-slate-500 uppercase">
                {entityKindLabels[group.kind]}s
              </p>
              <ul>
                {group.hits.map((hit) => {
                  const index = flat.indexOf(hit)
                  const isActive = index === activeIndex
                  return (
                    <li key={`${hit.kind}-${hit.id}`}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => go(hit)}
                        className={cn(
                          'flex w-full flex-col items-start px-3 py-1.5 text-left',
                          isActive ? 'bg-brand-50' : 'hover:bg-slate-50',
                        )}
                      >
                        <span className="text-sm text-slate-900">{hit.title}</span>
                        <span className="text-xs text-slate-500">{hit.subtitle}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
