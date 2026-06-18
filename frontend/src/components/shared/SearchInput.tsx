import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function SearchInput({ label, className, ...props }: SearchInputProps) {
  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-soft)]" />
        <input
          className={cn(
            'brand-ring w-full rounded-full border border-[var(--color-hairline)] bg-white py-3.5 pl-11 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-soft)] transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none',
            className,
          )}
          {...props}
        />
      </div>
    </label>
  )
}

export default SearchInput
