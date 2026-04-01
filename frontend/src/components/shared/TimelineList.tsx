import type { EnrollmentTimelineItem } from '@/types/enrollment'
import { formatDateTime } from '@/lib/date'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface TimelineListProps {
  items: EnrollmentTimelineItem[]
}

export function TimelineList({ items }: TimelineListProps) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item.timestamp}-${index}`} className="flex gap-4">
          <div className="mt-1 h-3 w-3 rounded-full bg-teal-500 shadow-[0_0_0_6px_rgba(20,184,166,0.12)]" />
          <div className="min-w-0 flex-1 space-y-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge kind="enrollment" status={item.status} />
              <span className="text-xs text-slate-500">{formatDateTime(item.timestamp)}</span>
            </div>
            <p className="text-sm font-medium text-slate-900">{item.note}</p>
            <p className="text-xs text-slate-500">
              Actor: {item.actorId} • {item.actorRole}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TimelineList
