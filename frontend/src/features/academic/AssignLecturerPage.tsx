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

export function AssignLecturerPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [nextLecturerId, setNextLecturerId] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const selectedSection = sections.find((item) => item.section.id === selectedSectionId)
  const lecturers = snapshot.users.filter((user) => user.roles.includes('LECTURER'))

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Phân công giảng viên" subtitle="Gán giảng viên cho lớp học phần và kiểm tra trùng lịch trước khi lưu thay đổi." />

      <div className="grid gap-6 lg:grid-cols-[0.58fr_0.42fr]">
        <Card title="Danh sách section cần phân công" description="Chọn section và cập nhật giảng viên phụ trách">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-2xl border px-4 py-4 text-left ${selectedSectionId === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => {
                  setSelectedSectionId(row.section.id)
                  setNextLecturerId(row.section.lecturerId)
                }}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Cập nhật giảng viên" description="Xem thông tin lớp và chọn giảng viên mới">
          {selectedSection ? (
            <div className="grid gap-4">
              <InfoList items={[{ label: 'Lớp học phần', value: selectedSection.section.sectionCode }, { label: 'Môn học', value: selectedSection.course?.name ?? selectedSection.section.courseCode }, { label: 'Lịch', value: `Thứ ${selectedSection.section.weekday} - Tiết ${selectedSection.section.startPeriod}` }, { label: 'Giảng viên hiện tại', value: selectedSection.lecturer?.fullName ?? '--' }]} />
              <Input label="Giảng viên mới" value={nextLecturerId} onChange={(event) => setNextLecturerId(event.target.value)} list="academic-lecturer-options" />
              <Button
                onClick={async () => {
                  try {
                    await sectionService.assignLecturer(selectedSection.section.id, nextLecturerId, actor)
                    pushToast({ tone: 'success', title: 'Đã cập nhật giảng viên', description: 'Lớp học phần đã được cập nhật người phụ trách.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể phân công giảng viên', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Phân công
              </Button>
              <datalist id="academic-lecturer-options">
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id} />
                ))}
              </datalist>
            </div>
          ) : (
            <EmptyState title="Chưa chọn section" description="Hãy chọn một lớp học phần ở cột bên trái để cập nhật giảng viên." />
          )}
        </Card>
      </div>
    </div>
  )
}

export default AssignLecturerPage;
