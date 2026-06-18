import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'

interface StatCardProps {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <Card className="h-full" contentClassName="flex items-center justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-muted)]">{label}</p>
        <p className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{value}</p>
        {hint ? <p className="text-sm text-[var(--color-muted)]">{hint}</p> : null}
      </div>
      {icon ? (
        <div className="rounded-full bg-[var(--color-surface-strong)] p-3 text-[var(--color-muted)]">
          {icon}
        </div>
      ) : null}
    </Card>
  )
}

export default StatCard
