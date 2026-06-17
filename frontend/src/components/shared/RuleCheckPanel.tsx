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
  title = 'Ket qua kiem tra dieu kien',
  checks,
  summary,
}: RuleCheckPanelProps) {
  return (
    <Card title={title} description={summary}>
      <div className="space-y-3">
        {checks.map((check) => (
          <div
            key={check.key}
            className={`flex gap-3 rounded-2xl border px-4 py-3 ${check.passed ? 'border-teal-100 bg-teal-50/70' : 'border-rose-100 bg-rose-50/70'}`}
          >
            <div className={check.passed ? 'text-teal-700' : 'text-rose-700'}>
              {check.passed ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">{check.label}</p>
              <p className="text-sm text-slate-600">{check.message}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RuleCheckPanel
