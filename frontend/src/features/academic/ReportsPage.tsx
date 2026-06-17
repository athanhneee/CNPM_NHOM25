import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { FilterBar } from '@/components/shared/FilterBar'
import { InfoList } from '@/components/shared/InfoList'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { reportService } from '@/services/report.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
import { getCurrentSemesterSections, getSectionStudents, getSectionWaitlist } from '@/lib/selectors'
import type { Course, WishRequest } from '@/types/course'
import type { ReportRow, UtilizationStats } from '@/types/settings'
import type { SectionStatus } from '@/types/section'

type CourseTypeValue = NonNullable<Course['courseType']>

type AcademicBlockValue = NonNullable<Course['academicBlock']>

const DEFAULT_COURSE_TYPE: CourseTypeValue = 'Tự chọn'

const DEFAULT_ACADEMIC_BLOCK: AcademicBlockValue = 'electiveCourses'

const DEFAULT_ROOM_OPTIONS = ['A1-101', 'A1-201', 'A2-301', 'B1-201', 'LAB-01']

const MAJOR_CODE_BY_NAME: Record<string, string> = {
  'Công nghệ thông tin': '7480201',
  'An toàn thông tin': '7480202',
}

function normalizeMajors(rawValue: string) {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resolveCourseCategory(
  academicBlock: AcademicBlockValue,
  courseType: CourseTypeValue,
) {
  if (courseType === 'Đồ án') {
    return 'THESIS' as const
  }

  if (academicBlock === 'electiveCourses' || courseType === 'Tự chọn') {
    return 'ELECTIVE' as const
  }

  if (academicBlock === 'generalEducationCourses' || academicBlock === 'foundationCourses') {
    return 'FOUNDATION' as const
  }

  return 'CORE' as const
}

function useAcademicContext() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const pushToast = useUiStore((state) => state.pushToast)

  useEffect(() => {
    if (
      !currentUser?.roles.includes('ACADEMIC_OFFICE') &&
      !currentUser?.roles.includes('ADMIN')
    ) {
      return
    }

    let mounted = true
    useDataStore.getState().setApiStatus('loading')

    Promise.all([
      courseService.listCourses(),
      sectionService.listSections(),
      enrollmentService.listEnrollments(),
    ])
      .then(() => {
        if (!mounted) return
        useDataStore.getState().setApiStatus('ready')
        useDataStore.getState().setLastSyncedAt(new Date().toISOString())
      })
      .catch((err) => {
        if (!mounted) return
        useDataStore.getState().setApiStatus('error', err instanceof Error ? err.message : 'Unknown error')
      })

    return () => {
      mounted = false
    }
  }, [currentUser?.id, currentUser?.roles])

  return {
    currentUser,
    snapshot,
    pushToast,
    actor: currentUser
      ? { actorId: currentUser.id, actorRole: currentUser.roles[0] ?? 'ACADEMIC_OFFICE' }
      : null,
  }
}

function buildRoomOptions(rooms: string[]) {
  return Array.from(new Set([...DEFAULT_ROOM_OPTIONS, ...rooms.filter(Boolean)])).sort((left, right) =>
    left.localeCompare(right),
  )
}

const wishStatusLabels: Record<WishRequest['status'], string> = {
  PENDING: 'Chờ xử lý',
  REVIEWED: 'Đã xem',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  CANCELLED: 'Đã hủy',
}

const wishStatusClassNames: Record<WishRequest['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  REVIEWED: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

function WishStatusBadge({ status }: { status: WishRequest['status'] }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${wishStatusClassNames[status]}`}>
      {wishStatusLabels[status]}
    </span>
  )
}

function formatWishDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ReportsPage() {
  const { currentUser, snapshot } = useAcademicContext()
  const [backendRows, setBackendRows] = useState<ReportRow[] | null>(null)
  const [backendStats, setBackendStats] = useState<UtilizationStats | null>(null)
  const [reportError, setReportError] = useState('')
  const currentSemesterId = snapshot.settings.currentSemesterId

  const fallbackRows = useMemo(
    () =>
      getCurrentSemesterSections(snapshot).map((row) => ({
        id: row.section.id,
        sectionCode: row.section.sectionCode,
        courseCode: row.section.courseCode,
        courseName: row.course?.name ?? row.section.courseCode,
        lecturerName: row.lecturer?.fullName ?? '--',
        capacity: row.section.capacity,
        registeredCount: row.section.registeredCount,
        waitlistCount: row.section.waitlistCount,
        utilizationRate: row.section.capacity ? row.section.registeredCount / row.section.capacity : 0,
        status: row.derivedStatus,
      })),
    [snapshot],
  )
  const rows = backendRows ?? fallbackRows
  const stats = backendStats ?? {
    totalSections: rows.length,
    totalCapacity: rows.reduce((sum, row) => sum + row.capacity, 0),
    totalRegistered: rows.reduce((sum, row) => sum + row.registeredCount, 0),
    totalWaitlisted: rows.reduce((sum, row) => sum + row.waitlistCount, 0),
    averageUtilization: rows.reduce((sum, row) => sum + row.utilizationRate, 0) / Math.max(rows.length, 1),
    fullSections: rows.filter((row) => row.status === 'FULL').length,
  }

  useEffect(() => {
    if (!currentUser) {
      return
    }

    let cancelled = false

    Promise.all([
      reportService.getRegistrationSummary(currentSemesterId),
      reportService.getUtilizationStats(currentSemesterId),
    ])
      .then(([nextRows, nextStats]) => {
        if (cancelled) {
          return
        }
        setBackendRows(nextRows)
        setBackendStats(nextStats)
        setReportError('')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setBackendRows(null)
        setBackendStats(null)
        setReportError(error instanceof Error ? error.message : 'Không tải được báo cáo từ backend.')
      })

    return () => {
      cancelled = true
    }
  }, [currentSemesterId, currentUser])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Phòng đào tạo - Thống kê và báo cáo"
        subtitle="Tổng hợp tỷ lệ lấp đầy, section full và tình hình phân bổ giảng viên trong học kỳ."
        actions={<ExportButtons fileName="academic-reports.csv" onExportCsv={() => void reportService.exportReportCsv('academic-reports.csv', currentSemesterId)} />}
      />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tổng lớp" value={String(stats.totalSections)} hint="Học kỳ hiện tại" />
        <StatCard label="Tổng sức chứa" value={String(stats.totalCapacity)} hint="Tất cả lớp đang mở" />
        <StatCard label="Đã đăng ký" value={String(stats.totalRegistered)} hint="Sinh viên DK_TC" />
        <StatCard label="Tỷ lệ lấp đầy" value={`${Math.round(stats.averageUtilization * 100)}%`} hint="Theo tổng sức chứa" />
        <StatCard label="Lớp full" value={String(stats.fullSections)} hint="Cần cân nhắc mở thêm lớp" />
        <StatCard label="Waitlist" value={String(stats.totalWaitlisted)} hint="Sinh viên đang chờ" />
      </div>
      {reportError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {reportError}
        </div>
      ) : null}
      <Card title="Bảng báo cáo" description="Tổng hợp theo lớp học phần, giảng viên và sĩ số">
        <div className="grid gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.sectionCode} - {row.courseName}</p>
                  <p className="text-sm text-slate-500">{row.lecturerName}</p>
                </div>
                <StatusBadge kind="section" status={row.status as SectionStatus} />
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(row.utilizationRate * 100, 100)}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {row.registeredCount}/{row.capacity} sinh viên - {Math.round(row.utilizationRate * 100)}% - waitlist {row.waitlistCount}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default ReportsPage;
