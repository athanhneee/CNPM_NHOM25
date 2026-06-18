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
      {label ? <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span> : null}
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--color-muted-soft)]">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={resolvedId}
          className={cn(
            'brand-ring w-full rounded-full border border-[var(--color-hairline)] bg-white px-5 py-3.5 text-sm leading-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted-soft)] transition focus:border-[var(--color-ink)] focus:border-2 focus:outline-none',
            leftIcon ? 'pl-12' : '',
            rightAdornment ? 'pr-12' : '',
            error ? 'border-amber-400 focus:border-amber-500' : '',
            className,
          )}
          {...props}
        />
        {rightAdornment ? (
          <span className="absolute inset-y-0 right-4 flex items-center text-[var(--color-muted-soft)]">
            {rightAdornment}
          </span>
        ) : null}
      </div>
      {error ? <span className="text-sm text-amber-700">{error}</span> : null}
      {!error && hint ? <span className="text-sm text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  )
}

export default Input

