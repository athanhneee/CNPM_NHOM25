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
      <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-2.5 scrollbar-thin">
        {checks.map((check) => (
          <div
            key={check.key}
            className={`flex items-center gap-3.5 rounded-full border px-5 py-2.5 transition-colors ${
              check.passed
                ? 'border-emerald-100 bg-emerald-50/30 hover:bg-emerald-50/60'
                : 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/50'
            }`}
          >
            <div className={`shrink-0 ${check.passed ? 'text-emerald-500' : 'text-amber-500'}`}>
              {check.passed ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800 truncate">{check.label}</p>
              <p className="text-[13px] text-slate-500 truncate" title={check.message}>
                {check.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default RuleCheckPanel
