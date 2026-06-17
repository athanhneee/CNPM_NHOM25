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
          'brand-ring rounded-2xl border border-slate-200 bg-white/96 px-5 py-4 text-sm text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.04)]',
          error ? 'border-rose-300 focus-visible:ring-rose-400' : 'focus-visible:ring-teal-500',
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
      {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default Select

