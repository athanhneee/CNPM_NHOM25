import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  children: ReactNode
  actions?: ReactNode
  className?: string
}

export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <section className={cn('surface-panel grid gap-4 px-5 py-5', className)}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}

export default FilterBar
