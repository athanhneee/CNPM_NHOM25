import { Card } from '@/components/ui/Card'

interface CreditMeterProps {
  current: number
  min: number
  max: number
}

export function CreditMeter({ current, min, max }: CreditMeterProps) {
  const ratio = Math.min(current / Math.max(max, 1), 1)
  const tone =
    current > max ? 'bg-amber-500' : current >= max * 0.8 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-ink)]'

  return (
    <Card title="Đồng hồ tín chỉ" description="Theo dõi tổng tín chỉ trong học kỳ hiện tại">
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <p className="text-2xl font-semibold text-[var(--color-ink)]">{current}</p>
          <p className="text-sm text-[var(--color-muted)]">
            Tối thiểu {min} • Tối đa {max}
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--color-surface-strong)]">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${tone}`} style={{ width: `${ratio * 100}%` }} />
        </div>
      </div>
    </Card>
  )
}

export default CreditMeter
