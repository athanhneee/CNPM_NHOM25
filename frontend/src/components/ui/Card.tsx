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
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-hairline-soft)] px-6 py-5">
          <div className="space-y-1">
            {title ? <h3 className="text-xl font-semibold tracking-tight text-[var(--color-ink)]">{title}</h3> : null}
            {description ? <p className="text-sm text-[var(--color-muted)]">{description}</p> : null}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-6', contentClassName)}>{children}</div>
    </section>
  )
}

export default Card
