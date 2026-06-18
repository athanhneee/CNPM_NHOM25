import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("surface-panel grid place-items-center gap-4 px-6 py-12 text-center", className)}>
      <div className="rounded-full bg-[var(--color-surface-strong)] p-4 text-[var(--color-muted)]">
        <Inbox className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="max-w-xl text-sm text-[var(--color-muted)]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default EmptyState

