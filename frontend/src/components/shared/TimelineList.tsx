import type { EnrollmentTimelineItem } from '@/types/enrollment'
import { formatDateTime } from '@/lib/date'
import { StatusBadge } from '@/components/shared/StatusBadge'

interface TimelineListProps {
  items: EnrollmentTimelineItem[]
}

export function TimelineList({ items }: TimelineListProps) {
  return (
    <div className="space-y-0 pt-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <div key={`${item.timestamp}-${index}`} className="relative flex gap-5">
            <div className="flex flex-col items-center">
              <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white ring-4 ring-slate-50">
                <div className="h-3 w-3 rounded-full bg-teal-500" />
              </div>
              {!isLast && <div className="w-0.5 flex-1 bg-slate-200" />}
            </div>
            <div className="min-w-0 flex-1 pb-8">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:border-teal-200 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <StatusBadge kind="enrollment" status={item.status} />
                  <span className="text-[13px] font-medium text-slate-500">{formatDateTime(item.timestamp)}</span>
                </div>
                <p className="text-[15px] font-semibold text-slate-900 mb-2">{item.note}</p>
                <p className="text-[13px] text-slate-500">
                  Thực hiện bởi: <span className="font-medium text-slate-700">{item.actorId}</span> ({item.actorRole})
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TimelineList
