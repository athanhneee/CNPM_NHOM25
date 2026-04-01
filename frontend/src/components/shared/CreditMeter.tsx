import { Card } from '@/components/ui/Card'

interface CreditMeterProps {
  current: number
  min: number
  max: number
}

export function CreditMeter({ current, min, max }: CreditMeterProps) {
  const ratio = Math.min(current / Math.max(max, 1), 1)
  const tone =
    current > max ? 'bg-rose-500' : current >= max * 0.8 ? 'bg-amber-500' : 'bg-teal-500'

  return (
    <Card title="Dong ho tin chi" description="Theo doi tong tin chi trong hoc ky hien tai">
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-3xl font-semibold text-slate-900">{current}</p>
          <p className="text-sm text-slate-500">
            Toi thieu {min} • Toi da {max}
          </p>
        </div>
        <div className="h-3 rounded-full bg-slate-100">
          <div className={`h-3 rounded-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
    </Card>
  )
}

export default CreditMeter
