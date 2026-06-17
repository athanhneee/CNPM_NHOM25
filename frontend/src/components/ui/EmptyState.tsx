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
      <div className="rounded-full bg-cyan-50 p-4 text-cyan-700">
        <Inbox className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="max-w-xl text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default EmptyState

