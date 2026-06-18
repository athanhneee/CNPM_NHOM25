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
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
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
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-teal-100/60 bg-gradient-to-b from-teal-50/80 to-white p-3 text-center shadow-[0_2px_10px_-3px_rgba(20,184,166,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(20,184,166,0.25)] sm:p-5">
              <div className="absolute -right-3 -top-3 opacity-[0.07] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125 group-hover:opacity-10">
                <BookOpenText className="h-16 w-16 text-teal-700" />
              </div>
              <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-teal-600 sm:text-sm">Tổng buổi</p>
              <p className="relative z-10 mt-1 text-2xl font-black tracking-tight text-teal-950 sm:text-3xl">{entries.length}</p>
            </div>

            <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-cyan-100/60 bg-gradient-to-b from-cyan-50/80 to-white p-3 text-center shadow-[0_2px_10px_-3px_rgba(6,182,212,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(6,182,212,0.25)] sm:p-5">
              <div className="absolute -right-3 -top-3 opacity-[0.07] transition-transform duration-500 group-hover:rotate-12 group-hover:scale-125 group-hover:opacity-10">
                <CalendarDays className="h-16 w-16 text-cyan-700" />
              </div>
              <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-cyan-600 sm:text-sm">Ngày học</p>
              <p className="relative z-10 mt-1 text-2xl font-black tracking-tight text-cyan-950 sm:text-3xl">{uniqueDays}</p>
            </div>

            <div className="group relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-indigo-100/60 bg-gradient-to-b from-indigo-50/80 to-white p-3 text-center shadow-[0_2px_10px_-3px_rgba(99,102,241,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_-6px_rgba(99,102,241,0.25)] sm:p-5">
              <div className="absolute -right-3 -top-3 opacity-[0.07] transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-125 group-hover:opacity-10">
                <MapPin className="h-16 w-16 text-indigo-700" />
              </div>
              <p className="relative z-10 text-[10px] font-bold uppercase tracking-widest text-indigo-600 sm:text-sm">Phòng học</p>
              <p className="relative z-10 mt-1 text-2xl font-black tracking-tight text-indigo-950 sm:text-3xl">{uniqueRooms}</p>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[1180px] space-y-3">
              <div className="grid grid-cols-[150px_repeat(7,minmax(145px,1fr))] gap-3 relative">
                <div className="sticky left-0 z-20 flex flex-col justify-center border-b-2 border-slate-200 bg-white pb-4 pt-2 shadow-[8px_0_16px_-4px_rgba(0,0,0,0.05)]">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Khung giờ</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">Tiết học</p>
                </div>

                {weekdays.map((day) => (
                  <div
                    key={day.weekday}
                    className="flex items-center justify-center border-b-2 border-cyan-100 pb-4 pt-2 text-center"
                  >
                    <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {day.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[150px_repeat(7,minmax(145px,1fr))] gap-3 relative">
                <div className="sticky left-0 z-20 grid auto-rows-[90px] bg-white shadow-[8px_0_16px_-4px_rgba(0,0,0,0.05)]">
                  {periodSlots.map((slot) => (
                    <div
                      key={slot.period}
                      className="border-b border-dashed border-slate-200 px-2 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-950">Tiết {slot.period}</p>
                      <p className="mt-1 text-sm text-slate-500">{slot.time}</p>
                      <p className="mt-1 text-[11px] font-medium text-teal-600">{slot.bucket}</p>
                    </div>
                  ))}
                </div>

                {weekdays.map((day) => {
                  const dayEntries = entries.filter((entry) => entry.weekday === day.weekday)

                  return (
                    <div key={day.weekday} className="grid auto-rows-[90px]">
                      {periodSlots.map((slot) => (
                        <div
                          key={`${day.weekday}-${slot.period}`}
                          className="border-b border-dashed border-slate-200"
                          style={{ gridRow: `${slot.period} / span 1` }}
                        />
                      ))}

                      {dayEntries.map((entry) => (
                        <article
                          key={entry.id}
                          className={cn(
                            'relative z-10 m-1 overflow-hidden rounded-2xl border p-3 shadow-sm transition hover:shadow-md',
                            getScheduleTone(entry.sectionStatus),
                          )}
                          style={{
                            gridRow: `${entry.startPeriod} / span ${Math.max(entry.periodCount, 1)}`,
                          }}
                        >
                          <div className="flex h-full flex-col justify-between gap-2">
                            <div className="space-y-1">
                              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700">
                                <BookOpenText className="h-3 w-3" />
                                {entry.courseCode}
                              </div>

                              <div className="pt-1">
                                <p className="text-sm font-semibold leading-tight text-slate-950">{entry.title}</p>
                                <p className="mt-0.5 text-[11px] font-medium text-slate-600">{entry.sectionCode}</p>
                              </div>
                            </div>

                            <div className="space-y-1 text-[11px] text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Clock3 className="h-3 w-3 text-teal-600" />
                                <span>{getPeriodRangeLabel(entry)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3 w-3 text-cyan-600" />
                                <span className="font-medium text-slate-700">{entry.room}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <UserRound className="h-3 w-3 text-slate-500" />
                                <span>{entry.lecturerName}</span>
                              </div>
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
        <div className="grid min-h-72 place-items-center rounded-3xl border border-dashed border-cyan-200 bg-gradient-to-br from-cyan-50/70 via-white to-teal-50/80 px-6 text-center">
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

