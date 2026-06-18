import { CalendarDays, Clock3, GraduationCap, MapPin, UserRound } from 'lucide-react'
import type { ScheduleEntry } from '@/types/schedule'
import { Table, type TableColumn } from '@/components/ui/Table'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getWeekdayLabel } from '@/lib/selectors'

interface SemesterScheduleTableProps {
  entries: ScheduleEntry[]
}

function getPeriodRangeLabel(row: ScheduleEntry) {
  const endPeriod = row.startPeriod + row.periodCount - 1
  return `Tiết ${row.startPeriod}${endPeriod > row.startPeriod ? ` - ${endPeriod}` : ''}`
}

export function SemesterScheduleTable({ entries }: SemesterScheduleTableProps) {
  const uniqueRooms = new Set(entries.map((entry) => entry.room)).size
  const uniqueLecturers = new Set(entries.map((entry) => entry.lecturerName)).size
  const totalPeriods = entries.reduce((sum, entry) => sum + entry.periodCount, 0)

  const columns: TableColumn<ScheduleEntry>[] = [
    {
      key: 'course',
      header: 'Học phần',
      className: 'min-w-[240px]',
      render: (row) => (
        <div className="space-y-1">
          <p className="font-semibold text-slate-950">{row.title}</p>
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
            <GraduationCap className="h-3.5 w-3.5" />
            {row.courseCode} • {row.sectionCode}
          </div>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Lịch học',
      className: 'min-w-[220px]',
      render: (row) => (
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
            <CalendarDays className="h-3.5 w-3.5" />
            {getWeekdayLabel(row.weekday)}
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p className="flex items-center gap-2">
              <Clock3 className="h-3.5 w-3.5 text-teal-600" />
              <span>{getPeriodRangeLabel(row)}</span>
            </p>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Tuần {row.weeks}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Địa điểm',
      className: 'min-w-[170px]',
      render: (row) => (
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium text-slate-900">
            <MapPin className="h-3.5 w-3.5 text-cyan-600" />
            {row.room}
          </p>
          <p className="text-sm text-slate-500">Phòng học đã được xác nhận cho lịch hiện tại.</p>
        </div>
      ),
    },
    {
      key: 'lecturer',
      header: 'Giảng viên',
      className: 'min-w-[180px]',
      render: (row) => (
        <div className="space-y-1">
          <p className="flex items-center gap-2 font-medium text-slate-900">
            <UserRound className="h-3.5 w-3.5 text-slate-500" />
            {row.lecturerName}
          </p>
          <p className="text-sm text-slate-500">Thông tin phụ trách hiển thị theo lớp học phần.</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      className: 'min-w-[150px]',
      render: (row) =>
        row.sectionStatus ? (
          <StatusBadge kind="section" status={row.sectionStatus} />
        ) : (
          <span className="text-slate-400">Chưa xác định</span>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-600">Tổng lớp hiển thị</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{entries.length}</p>
          <p className="mt-2 text-sm text-slate-600">Số dòng học phần đang có trong lịch học kỳ hiện tại.</p>
        </div>

        <div className="rounded-3xl border border-cyan-100 bg-white px-4 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-600">Phòng học sử dụng</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{uniqueRooms}</p>
          <p className="mt-2 text-sm text-slate-600">Số phòng học khác nhau được phân bổ trong lịch học kỳ.</p>
        </div>

        <div className="rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Tổng số tiết</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{totalPeriods}</p>
          <p className="mt-2 text-sm text-slate-600">
            {uniqueLecturers} giảng viên phụ trách trong danh sách đang xem.
          </p>
        </div>
      </div>

      <Table columns={columns} rows={entries} rowKey={(row) => row.id} />
    </div>
  )
}

export default SemesterScheduleTable

