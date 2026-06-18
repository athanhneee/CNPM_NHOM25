interface SectionCapacityBarProps {
  registeredCount: number
  capacity: number
  waitlistCount?: number
}

export function SectionCapacityBar({
  registeredCount,
  capacity,
  waitlistCount = 0,
}: SectionCapacityBarProps) {
  const ratio = Math.min(registeredCount / Math.max(capacity, 1), 1)
  const tone = registeredCount >= capacity ? 'bg-[var(--color-accent)]' : ratio > 0.8 ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-ink)]'

  return (
    <div className="space-y-2">
      <div className="h-1 rounded-full bg-[var(--color-surface-strong)]">
        <div className={`h-1 rounded-full transition-all duration-500 ${tone}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
        <span>
          {registeredCount}/{capacity} đã đăng ký
        </span>
        <span>Danh sách chờ: {waitlistCount}</span>
      </div>
    </div>
  )
}

export default SectionCapacityBar
