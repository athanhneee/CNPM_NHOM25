import { CircleAlert, CircleCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface RuleCheck {
  key: string
  label: string
  passed: boolean
  message: string
}

interface RuleCheckPanelProps {
  title?: string
  checks: RuleCheck[]
  summary: string
}

export function RuleCheckPanel({
  title = 'Kết quả kiểm tra điều kiện',
  checks,
  summary,
}: RuleCheckPanelProps) {
  return (
    <Card title={title} description={summary}>
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2">
        {checks.map((check) => (
          <div
            key={check.key}
            className={`flex items-center gap-3 rounded-3xl bg-[var(--color-surface-soft)] px-5 py-3.5 ${check.passed ? 'ring-1 ring-emerald-200' : 'ring-1 ring-amber-200'}`}
          >
            <div className={check.passed ? 'text-[var(--color-ink)]' : 'text-[var(--color-accent)]'}>
              {check.passed ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-[var(--color-ink)]">{check.label}</p>
              <p className="text-sm text-[var(--color-body)]">{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RuleCheckPanel
