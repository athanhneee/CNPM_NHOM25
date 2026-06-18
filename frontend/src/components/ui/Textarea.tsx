import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export function Textarea({ label, hint, error, className, id, ...props }: TextareaProps) {
  const resolvedId = id ?? props.name

  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <textarea
        id={resolvedId}
        className={cn(
          'brand-ring min-h-28 rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-4 text-sm leading-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted-soft)]',
          error ? 'border-amber-300 focus-visible:ring-amber-400' : 'focus-visible:ring-teal-500',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm text-amber-700">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default Textarea

