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

export function WaitlistOverridePage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [studentId, setStudentId] = useState(snapshot.users.find((user) => user.roles.includes('STUDENT'))?.id ?? '')
  const [reason, setReason] = useState('Cần can thiệp theo đề xuất nghiệp vụ.')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot).filter((section) => section.section.waitlistCount > 0 || section.derivedStatus === 'FULL')
  const selected = sections.find((item) => item.section.id === selectedSectionId) ?? sections[0]
  const waitlistRows = selected ? getSectionWaitlist(snapshot, selected.section.id) : []

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Danh sách chờ và can thiệp" subtitle="Xử lý danh sách chờ theo thứ tự và can thiệp đặc biệt có lý do, đồng thời ghi nhật ký cho mọi thay đổi." />
      <div className="grid gap-6 lg:grid-cols-[0.54fr_0.46fr]">
        <Card title="Danh sách chờ" description="Chọn lớp học phần để xem hàng chờ và xử lý nhanh">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-2xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => setSelectedSectionId(row.section.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.section.waitlistCount} sinh viên đang chờ</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card title="Thứ tự danh sách chờ" description="Hiển thị theo thứ tự xử lý của lớp học phần đang chọn">
            {waitlistRows.length ? (
              <div className="grid gap-3">
                {waitlistRows.map((row) => (
                  <div key={row.enrollment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="font-semibold text-slate-900">{row.student?.fullName ?? row.student?.code}</p>
                    <p className="text-sm text-slate-500">Thứ tự chờ: {row.enrollment.waitlistOrder ?? '--'}</p>
                  </div>
                ))}
                <Button
                  onClick={async () => {
                    if (!selected) {
                      return
                    }
                    const promoted = await enrollmentService.processWaitlist(selected.section.id, actor)
                    pushToast({ tone: promoted.length ? 'success' : 'info', title: 'Xử lý danh sách chờ hoàn tất', description: promoted.length ? `Đã chuyển ${promoted.length} sinh viên sang DK_TC.` : 'Không có bản ghi nào đủ điều kiện.' })
                  }}
                  type="button"
                >
                  Xử lý theo thứ tự
                </Button>
              </div>
            ) : (
              <EmptyState title="Chưa có danh sách chờ" description="Lớp học phần đang chọn chưa có sinh viên trong hàng chờ." />
            )}
          </Card>

          <Card title="Can thiệp thủ công" description="Nhập lý do bắt buộc và chọn sinh viên cần can thiệp đăng ký">
            <div className="grid gap-4">
              <Input label="MSSV / Mã người dùng" value={studentId} onChange={(event) => setStudentId(event.target.value)} list="override-student-options" />
              <Textarea label="Lý do can thiệp" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Button
                onClick={async () => {
                  if (!selected) {
                    return
                  }
                  try {
                    await enrollmentService.overrideEnrollment(studentId, selected.section.id, reason, actor)
                    pushToast({ tone: 'success', title: 'Can thiệp thành công', description: 'Bản ghi đăng ký đã được cập nhật và ghi log.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể can thiệp', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Can thiệp đăng ký
              </Button>
              <datalist id="override-student-options">
                {snapshot.users.filter((user) => user.roles.includes('STUDENT')).map((student) => (
                  <option key={student.id} value={student.id} />
                ))}
              </datalist>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default WaitlistOverridePage;
