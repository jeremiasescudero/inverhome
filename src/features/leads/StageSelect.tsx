import { useId } from 'react'
import { leadStageMeta } from '@/lib/labels'
import type { LeadStage } from '@/types'

export interface StageSelectProps {
  value: LeadStage
  stages: LeadStage[]
  onChange: (stage: LeadStage) => void
}

/** Stage picker shared by the drawer and the detail page. */
export function StageSelect({ value, stages, onChange }: StageSelectProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1 rounded-md border border-brand-200 bg-brand-50/50 px-3 py-2">
      <label htmlFor={id} className="text-2xs font-medium tracking-wide text-brand-800 uppercase">
        Mover a etapa
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as LeadStage)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
      >
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {leadStageMeta[stage].label}
          </option>
        ))}
      </select>
    </div>
  )
}
