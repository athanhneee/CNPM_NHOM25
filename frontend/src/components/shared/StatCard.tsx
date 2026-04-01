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
    <Card className="h-full" contentClassName="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      {icon ? (
        <div className="rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 p-3 text-teal-700">
          {icon}
        </div>
      ) : null}
    </Card>
  )
}

export default StatCard
