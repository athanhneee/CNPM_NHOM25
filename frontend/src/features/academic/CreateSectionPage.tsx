import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { InfoList } from '@/components/shared/InfoList'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { adminService } from '@/services/admin.api'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { sectionService } from '@/services/section.api'
import { getCurrentSemesterSections } from '@/lib/selectors'
import type { Course, WishRequest } from '@/types/course'

type CourseTypeValue = NonNullable<Course['courseType']>

type AcademicBlockValue = NonNullable<Course['academicBlock']>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_COURSE_TYPE: CourseTypeValue = 'Tự chọn'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_ACADEMIC_BLOCK: AcademicBlockValue = 'electiveCourses'

const DEFAULT_ROOM_OPTIONS = ['A1-101', 'A1-201', 'A2-301', 'B1-201', 'LAB-01']

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAJOR_CODE_BY_NAME: Record<string, string> = {
  'Công nghệ thông tin': '7480201',
  'An toàn thông tin': '7480202',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeMajors(rawValue: string) {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      adminService.listUsers({ role: 'LECTURER', limit: 1000 }),
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
  REJECTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WishStatusBadge({ status }: { status: WishRequest['status'] }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${wishStatusClassNames[status]}`}>
      {wishStatusLabels[status]}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatWishDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function CreateSectionPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [form, setForm] = useState({
    sectionCode: 'INT3999-01',
    courseCode: snapshot.courses[0]?.code ?? '',
    group: '01',
    subGroup: '01',
    lecturerId: snapshot.users.find((user) => user.roles.includes('LECTURER'))?.id ?? '',
    room: 'A1-101',
    weekday: '2',
    startPeriod: '1',
    periodCount: '3',
    capacity: '40',
    weeks: '1-15',
    allowWaitlist: true,
    guestLecturer: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const roomOptions = useMemo(
    () => buildRoomOptions(snapshot.sections.map((section) => section.room)),
    [snapshot.sections],
  )

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const allSections = getCurrentSemesterSections(snapshot)
  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(allSections.length / itemsPerPage))
  const paginatedRows = allSections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const isGuestLecturer = form.lecturerId === 'OTHER'

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Tạo lớp học phần" subtitle="Khởi tạo lớp học phần mới trong học kỳ, đồng thời kiểm tra xung đột phòng và giảng viên." />

      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card title="Biểu mẫu tạo lớp học phần" description="Nhập thông tin cơ bản để tạo section mới">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mã môn học</label>
              <select
                className="flex h-9 w-full rounded-3xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.courseCode}
                onChange={(e) => {
                  const courseCode = e.target.value;
                  setForm((value) => ({
                    ...value,
                    courseCode,
                    sectionCode: `${courseCode}-${value.group.padStart(2, '0')}`
                  }))
                }}
              >
                {snapshot.courses.map((course) => (
                  <option key={course.id} value={course.code}>{course.code} - {course.name}</option>
                ))}
              </select>
            </div>

            <Input
              label="Nhóm"
              value={form.group}
              onChange={(event) => {
                const group = event.target.value;
                setForm((value) => ({
                  ...value,
                  group,
                  sectionCode: `${value.courseCode}-${group.padStart(2, '0')}`
                }))
              }}
            />

            <Input label="Mã lớp học phần" value={form.sectionCode} readOnly disabled />
            <Input label="Tổ" value={form.subGroup} onChange={(event) => setForm((value) => ({ ...value, subGroup: event.target.value }))} />

            <div className="space-y-1">
              <label className="text-sm font-medium">Giảng viên</label>
              <select
                className="flex h-9 w-full rounded-3xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.lecturerId}
                onChange={(e) => setForm((value) => ({ ...value, lecturerId: e.target.value }))}
              >
                {snapshot.users.filter((user) => user.roles.includes('LECTURER')).map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName} ({lecturer.code})</option>
                ))}
                <option value="OTHER">Khác (Giảng viên ngoài)</option>
              </select>
            </div>

            {isGuestLecturer && (
              <Input
                label="Tên giảng viên khác"
                value={form.guestLecturer || ''}
                onChange={(event) => setForm((value) => ({ ...value, guestLecturer: event.target.value }))}
                placeholder="Nhập tên giảng viên"
              />
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">Phòng học</label>
              <select
                className="flex h-9 w-full rounded-3xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.room}
                onChange={(e) => setForm((value) => ({ ...value, room: e.target.value }))}
              >
                {roomOptions.map((roomOption) => (
                  <option key={roomOption} value={roomOption}>{roomOption}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Thứ</label>
              <select
                className="flex h-9 w-full rounded-3xl border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={form.weekday}
                onChange={(e) => setForm((value) => ({ ...value, weekday: e.target.value }))}
              >
                {[2, 3, 4, 5, 6, 7].map(day => (
                  <option key={day} value={day}>Thứ {day}</option>
                ))}
                <option value={8}>Chủ Nhật</option>
              </select>
            </div>

            <Input type="number" min="1" max="15" label="Tiết bắt đầu" value={form.startPeriod} onChange={(event) => setForm((value) => ({ ...value, startPeriod: event.target.value }))} />
            <Input type="number" min="1" max="10" label="Số tiết" value={form.periodCount} onChange={(event) => setForm((value) => ({ ...value, periodCount: event.target.value }))} />
            <Input type="number" min="1" label="Sức chứa" value={form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              onClick={async () => {
                try {
                  const payload: Parameters<typeof sectionService.createSection>[0] = {
                    sectionCode: form.sectionCode,
                    courseCode: form.courseCode,
                    semesterId: snapshot.settings.currentSemesterId,
                    group: form.group,
                    subGroup: form.subGroup,
                    room: form.room,
                    weekday: Number(form.weekday) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
                    startPeriod: Number(form.startPeriod),
                    periodCount: Number(form.periodCount),
                    weeks: form.weeks,
                    capacity: Number(form.capacity),
                    allowWaitlist: false,
                    campus: 'HCM',
                    status: 'OPEN',
                  }

                  if (isGuestLecturer) {
                    payload.guestLecturer = form.guestLecturer
                  } else {
                    payload.lecturerId = form.lecturerId
                  }

                  await sectionService.createSection(payload, actor)
                  pushToast({ tone: 'success', title: 'Đã tạo lớp học phần', description: 'Section mới đã được thêm vào học kỳ hiện tại.' })
                } catch (error) {
                  pushToast({ tone: 'error', title: 'Không thể tạo section', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                }
              }}
              type="button"
            >
              Lưu section
            </Button>
          </div>
        </Card>

        <Card title="Lớp học phần tạo gần đây" description="Danh sách nhanh để đối chiếu xung đột và tình trạng mở lớp">
          <div className="grid gap-3">
            {paginatedRows.map((row) => (
              <div key={row.section.id} className="rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
                <div className="mt-3">
                  <InfoList items={[{ label: 'Phòng', value: row.section.room }, { label: 'Giảng viên', value: row.lecturer?.fullName ?? '--' }, { label: 'Lịch', value: `Thứ ${row.section.weekday} - Tiết ${row.section.startPeriod}` }]} compact />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-sm text-slate-500 font-medium">
                Hiển thị trang <span className="text-teal-700 font-bold">{currentPage}</span> / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                  type="button"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                  type="button"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default CreateSectionPage;
