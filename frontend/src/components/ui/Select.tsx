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
          'brand-ring rounded-full border border-[var(--color-hairline)] bg-white px-5 py-3.5 text-sm leading-normal text-[var(--color-ink)]',
          error ? 'border-amber-300 focus-visible:ring-amber-400' : 'focus-visible:ring-teal-500',
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

