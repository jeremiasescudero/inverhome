import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-500'

const CONTROL_INVALID = 'border-rose-400 bg-rose-50/40'

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + hint/error, so every form reports errors the same way. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-slate-700">
        {label}
        {required && (
          <span className="ml-0.5 text-rose-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-2xs text-rose-700">{error}</p>
      ) : (
        hint && <p className="text-2xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function TextInput({ label, hint, error, className, ...rest }: TextInputProps) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={rest.required}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(CONTROL, error && CONTROL_INVALID, className)}
        {...rest}
      />
    </Field>
  )
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectInputProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  options: SelectOption[]
  hint?: string
  error?: string
}

export function SelectInput({
  label,
  options,
  hint,
  error,
  className,
  ...rest
}: SelectInputProps) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={rest.required}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, error && CONTROL_INVALID, className)}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
}

export function TextArea({ label, hint, error, className, ...rest }: TextAreaProps) {
  const id = useId()
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} required={rest.required}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(CONTROL, 'min-h-24 resize-y', error && CONTROL_INVALID, className)}
        {...rest}
      />
    </Field>
  )
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string
  hint?: string
}

export function Checkbox({ label, hint, className, ...rest }: CheckboxProps) {
  const id = useId()
  return (
    <div className={cn('flex items-start gap-2', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 rounded border-slate-300 text-brand-600"
        {...rest}
      />
      <span>
        <label htmlFor={id} className="block text-xs font-medium text-slate-700">
          {label}
        </label>
        {hint && <span className="block text-2xs text-slate-500">{hint}</span>}
      </span>
    </div>
  )
}
