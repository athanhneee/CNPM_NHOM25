import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { InfoList } from '@/components/shared/InfoList'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { sectionService } from '@/services/section.api'
import { getCurrentSemesterSections, getSectionStudents } from '@/lib/selectors'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export function RegistrationManagementPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [capacity, setCapacity] = useState('60')
  const [reason, setReason] = useState('Mở rộng chỉ tiêu để xử lý nhóm nhu cầu cao.')
  const [currentPage, setCurrentPage] = useState(1)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(sections.length / itemsPerPage))
  const paginatedSections = sections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
  const selected = sections.find((item) => item.section.id === selectedSectionId) ?? sections[0]
  const students = selected ? getSectionStudents(snapshot, selected.section.id) : []

  const columns: TableColumn<(typeof students)[number]>[] = [
    { key: 'code', header: 'MSSV', render: (row) => row.student?.code ?? '--' },
    { key: 'name', header: 'Họ và tên', render: (row) => row.student?.fullName ?? '--' },
    { key: 'program', header: 'Lớp', render: (row) => row.student?.studentClass ?? row.student?.program ?? '--' },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="enrollment" status={row.enrollment.status} /> },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Quản lý đăng ký học phần" subtitle="Theo dõi sĩ số, sinh viên đăng ký, danh sách chờ và điều chỉnh chỉ tiêu section trong học kỳ." />
      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card title="Tổng hợp section" description="Chọn section để xem danh sách sinh viên và cập nhật chỉ tiêu">
          <div className="grid gap-3">
            {paginatedSections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-3xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => {
                  setSelectedSectionId(row.section.id)
                  setCapacity(String(row.section.capacity))
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

        {selected ? (
          <div className="grid gap-6">
            <Card title="Thông tin section" description="Cập nhật chỉ tiêu và xử lý danh sách chờ">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoList items={[{ label: 'Lớp học phần', value: selected.section.sectionCode }, { label: 'Môn học', value: selected.course?.name ?? selected.section.courseCode }, { label: 'Đã đăng ký', value: String(selected.section.registeredCount) }, { label: 'Danh sách chờ', value: String(selected.section.waitlistCount) }]} />
                <div className="grid gap-3">
                  <Input label="Sức chứa mới" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
                  <Textarea label="Lý do điều chỉnh" value={reason} onChange={(event) => setReason(event.target.value)} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={async () => {
                        try {
                          await sectionService.updateCapacity(selected.section.id, Number(capacity), reason, actor)
                          pushToast({ tone: 'success', title: 'Đã cập nhật chỉ tiêu', description: 'Section đã được cập nhật sức chứa mới.' })
                        } catch (error) {
                          pushToast({ tone: 'error', title: 'Không thể cập nhật chỉ tiêu', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                        }
                      }}
                      type="button"
                    >
                      Lưu điều chỉnh
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const promoted = await enrollmentService.processWaitlist(selected.section.id, actor)
                        pushToast({ tone: promoted.length ? 'success' : 'info', title: 'Xử lý danh sách chờ hoàn tất', description: promoted.length ? `Đã chuyển ${promoted.length} sinh viên sang Đăng ký thành công.` : 'Chưa có bản ghi nào đủ điều kiện.' })
                      }}
                      type="button"
                    >
                      Xử lý danh sách chờ
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Danh sách sinh viên" description="Hiển thị trạng thái đăng ký thực tế (Đăng ký thành công, Hủy đăng ký, v.v.)">
              <Table columns={columns} rows={students} rowKey={(row) => row.enrollment.id} />
            </Card>
          </div>
        ) : (
          <EmptyState title="Chưa có section nào" description="Không có dữ liệu section để quản lý." />
        )}
      </div>
    </div>
  )
}

export default RegistrationManagementPage;
