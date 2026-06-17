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
  const tone = registeredCount >= capacity ? 'bg-amber-500' : ratio > 0.8 ? 'bg-cyan-500' : 'bg-teal-500'

  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
        <span>
          {registeredCount}/{capacity} đã đăng ký
        </span>
        <span>Danh sách chờ: {waitlistCount}</span>
      </div>
    </div>
  )
}

export default SectionCapacityBar
