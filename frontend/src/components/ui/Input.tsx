import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightAdornment?: ReactNode
  wrapperClassName?: string
}

export function Input({
  label,
  hint,
  error,
  className,
  id,
  leftIcon,
  rightAdornment,
  wrapperClassName,
  ...props
}: InputProps) {
  const resolvedId = id ?? props.name

  return (
    <label className={cn('grid gap-2', wrapperClassName)}>
      {label ? <span className="text-sm font-semibold text-slate-700">{label}</span> : null}
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-slate-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={resolvedId}
          className={cn(
            'brand-ring w-full rounded-2xl border border-slate-200 bg-white/96 px-5 py-4 text-sm text-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.04)] placeholder:text-slate-400 transition',
            leftIcon ? 'pl-14' : '',
            rightAdornment ? 'pr-14' : '',
            error ? 'border-rose-300 focus-visible:ring-rose-400' : 'focus-visible:ring-teal-500',
            className,
          )}
          {...props}
        />
        {rightAdornment ? (
          <span className="absolute inset-y-0 right-5 flex items-center text-slate-400">
            {rightAdornment}
          </span>
        ) : null}
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

export default Input

