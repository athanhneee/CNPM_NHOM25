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
    <Card className="h-full" contentClassName="flex flex-col h-full gap-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] sm:text-sm font-medium text-[var(--color-muted)] leading-snug">{label}</p>
        {icon ? (
          <div className="shrink-0 rounded-full bg-[var(--color-surface-strong)] p-2 sm:p-3 text-[var(--color-muted)]">
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-1">
        <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-ink)]">{value}</p>
      </div>
      {hint ? (
        <p className="mt-auto pt-2 text-[11px] sm:text-[13px] text-[var(--color-muted)] leading-relaxed">
          {hint}
        </p>
      ) : null}
    </Card>
  )
}

export default StatCard
