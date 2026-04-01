import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function Card({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
}: CardProps) {
  return (
    <section className={cn('surface-panel overflow-hidden', className)}>
      {(title || description || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 bg-gradient-to-r from-teal-50/90 via-white to-cyan-50/90 px-6 py-5">
          <div className="space-y-1">
            {title ? <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3> : null}
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('px-6 py-6', contentClassName)}>{children}</div>
    </section>
  )
}

export default Card
