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
          'brand-ring min-h-28 rounded-2xl border border-slate-200 bg-white/96 px-5 py-4 text-sm text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.04)] placeholder:text-slate-400',
          error ? 'border-rose-300 focus-visible:ring-rose-400' : 'focus-visible:ring-teal-500',
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default Textarea

