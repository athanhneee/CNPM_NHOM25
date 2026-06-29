import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  label: string
  value: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: SelectOption[]
}

export function Select({ label, hint, error, options, className, id, ...props }: SelectProps) {
  const resolvedId = id ?? props.name

  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <select
        id={resolvedId}
        className={cn(
          'brand-ring rounded-full border border-transparent bg-slate-50 hover:bg-slate-100 px-5 py-3.5 text-sm leading-normal text-[var(--color-ink)] transition focus:bg-white focus:outline-none',
          error ? 'border-amber-300 focus-visible:ring-amber-400 bg-amber-50' : 'focus-visible:ring-2 focus-visible:ring-teal-500/20 focus-visible:border-teal-500',
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-sm text-amber-700">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default Select

