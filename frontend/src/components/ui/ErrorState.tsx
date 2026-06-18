import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'

interface ErrorStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function ErrorState({ title, description, action }: ErrorStateProps) {
  return (
    <div className="surface-panel grid place-items-center gap-4 border-amber-200 bg-amber-50/30 px-6 py-12 text-center">
      <div className="rounded-full bg-amber-100 p-4 text-amber-700">
        <TriangleAlert className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="max-w-xl text-sm text-[var(--color-muted)]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export default ErrorState
