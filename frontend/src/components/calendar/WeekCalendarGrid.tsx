import { BookOpenText, CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import type { ScheduleEntry } from '@/types/schedule'
import { WEEKDAY_LABELS } from '@/lib/selectors'

const periodSlots = [
  { period: 1, time: '07:00 - 07:50', bucket: 'Ca sáng' },
  { period: 2, time: '07:55 - 08:45', bucket: 'Ca sáng' },
  { period: 3, time: '09:00 - 09:50', bucket: 'Ca sáng' },
  { period: 4, time: '09:55 - 10:45', bucket: 'Ca sáng' },
  { period: 5, time: '12:30 - 13:20', bucket: 'Ca chiều' },
  { period: 6, time: '13:25 - 14:15', bucket: 'Ca chiều' },
  { period: 7, time: '14:30 - 15:20', bucket: 'Ca chiều' },
  { period: 8, time: '15:25 - 16:15', bucket: 'Ca chiều' },
  { period: 9, time: '18:00 - 18:50', bucket: 'Ca tối' },
  { period: 10, time: '18:55 - 19:45', bucket: 'Ca tối' },
]

interface WeekCalendarGridProps {
  entries: ScheduleEntry[]
  emptyMessage?: string
}

function getPeriodRangeLabel(entry: ScheduleEntry) {
  const endPeriod = entry.startPeriod + entry.periodCount - 1
  return `Tiết ${entry.startPeriod}${endPeriod > entry.startPeriod ? ` - ${endPeriod}` : ''}`
}

function getScheduleTone(sectionStatus?: ScheduleEntry['sectionStatus']) {
  switch (sectionStatus) {
    case 'COMPLETED':
      return 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50'
    case 'IN_PROGRESS':
      return 'border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50'
    case 'FULL':
      return 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
    case 'CLOSED':
      return 'border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100'
    default:
      return 'border-teal-200 bg-gradient-to-br from-teal-50 via-white to-cyan-50'
  }
}

export function WeekCalendarGrid({
  entries,
  emptyMessage = 'Không có buổi học nào phù hợp với bộ lọc hiện tại.',
}: WeekCalendarGridProps) {
  const weekdays = Object.entries(WEEKDAY_LABELS).map(([weekday, label]) => ({
    weekday: Number(weekday),
    label,
  }))

  const uniqueDays = new Set(entries.map((entry) => entry.weekday)).size
  const uniqueRooms = new Set(entries.map((entry) => entry.room)).size

  return (
    <Card
      title="Lịch dạng tuần theo học kỳ"
      description="Theo dõi các buổi học theo thứ, khung tiết, phòng học và dải tuần học trong học kỳ."
      actions={
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-teal-700">
            {entries.length} buổi theo khung tuần
          </span>
          <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-700">
            {uniqueDays || 0} ngày có lịch
          </span>
        </div>
      }
    >
      {entries.length ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[28px] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-600">Tổng buổi học</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{entries.length}</p>
              <p className="mt-2 text-sm text-slate-600">Các buổi học hợp lệ được hiển thị xuyên suốt học kỳ hiện tại.</p>
            </div>
            <div className="rounded-[28px] border border-cyan-100 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Phủ ngày học</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{uniqueDays}</p>
              <p className="mt-2 text-sm text-slate-600">Số ngày trong tuần có ít nhất một lớp học hoặc buổi giảng dạy.</p>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Phòng học sử dụng</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{uniqueRooms}</p>
              <p className="mt-2 text-sm text-slate-600">Tổng số phòng học xuất hiện trong lịch đang xem.</p>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[1180px] space-y-3">
              <div className="grid grid-cols-[150px_repeat(7,minmax(145px,1fr))] gap-3">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Khung giờ</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">Tiết học trong ngày</p>
                </div>

                {weekdays.map((day) => (
                  <div
                    key={day.weekday}
                    className="rounded-[28px] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50/60 to-teal-50 px-4 py-4"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {day.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[150px_repeat(7,minmax(145px,1fr))] gap-3">
                <div className="grid auto-rows-[84px] gap-3">
                  {periodSlots.map((slot) => (
                    <div
                      key={slot.period}
                      className="rounded-[26px] border border-slate-200 bg-white px-4 py-3 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.35)]"
                    >
                      <p className="text-sm font-semibold text-slate-950">Tiết {slot.period}</p>
                      <p className="mt-1 text-xs text-slate-500">{slot.time}</p>
                      <p className="mt-2 text-xs font-medium text-teal-600">{slot.bucket}</p>
                    </div>
                  ))}
                </div>

                {weekdays.map((day) => {
                  const dayEntries = entries.filter((entry) => entry.weekday === day.weekday)

                  return (
                    <div key={day.weekday} className="grid auto-rows-[84px] gap-3">
                      {periodSlots.map((slot) => (
                        <div
                          key={`${day.weekday}-${slot.period}`}
                          className="rounded-[26px] border border-slate-200/90 bg-slate-50/70"
                        />
                      ))}

                      {dayEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className={cn(
                            'relative z-10 overflow-hidden rounded-[28px] border p-4 shadow-[0_20px_40px_-28px_rgba(13,148,136,0.45)]',
                            getScheduleTone(entry.sectionStatus),
                          )}
                          style={{
                            gridRow: `${entry.startPeriod} / span ${Math.max(entry.periodCount, 1)}`,
                          }}
                        >
                          <div className="flex h-full flex-col justify-between gap-3">
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                                <BookOpenText className="h-3.5 w-3.5" />
                                {entry.courseCode}
                              </div>

                              <div>
                                <p className="text-sm font-semibold leading-6 text-slate-950">{entry.title}</p>
                                <p className="text-xs font-medium text-slate-600">{entry.sectionCode}</p>
                              </div>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center gap-2">
                                <Clock3 className="h-3.5 w-3.5 text-teal-600" />
                                <span>{getPeriodRangeLabel(entry)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5 text-cyan-600" />
                                <span>{entry.room}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <UserRound className="h-3.5 w-3.5 text-slate-500" />
                                <span>{entry.lecturerName}</span>
                              </div>
                              <p className="pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                                Tuần {entry.weeks}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid min-h-72 place-items-center rounded-[32px] border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50/70 via-white to-teal-50/80 px-6 text-center">
          <div className="max-w-xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-700">Lịch trống</p>
            <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              Chưa có buổi học nào trong lịch dạng tuần.
            </h3>
            <p className="text-sm leading-7 text-slate-600">{emptyMessage}</p>
          </div>
        </div>
      )}
    </Card>
  )
}

export default WeekCalendarGrid
