import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function SearchInput({ label, className, ...props }: SearchInputProps) {
  return (
    <label className="grid gap-2">
      {label ? <span className="text-sm font-medium text-slate-700">{label}</span> : null}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className={cn(
            'brand-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400',
            className,
          )}
          {...props}
        />
      </div>
    </label>
  )
}

export default SearchInput
