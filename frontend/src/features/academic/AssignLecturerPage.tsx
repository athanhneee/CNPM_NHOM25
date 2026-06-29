import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
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

export function AssignLecturerPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [nextLecturerId, setNextLecturerId] = useState('')
  const [nextGuestLecturer, setNextGuestLecturer] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const itemsPerPage = 5
  const totalPages = Math.max(1, Math.ceil(sections.length / itemsPerPage))
  const paginatedSections = sections.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const selectedSection = useMemo(() => {
    const sectionData = sections.find((s) => s.section.id === selectedSectionId)
    if (!sectionData) return null
    return {
      section: sectionData.section,
      course: sectionData.course,
      lecturer: snapshot.users.find((u) => u.id === sectionData.section.lecturerId),
    }
  }, [sections, selectedSectionId, snapshot.users])

  const lecturers = snapshot.users.filter((user) => user.roles.includes('LECTURER'))
  const isGuestLecturer = nextLecturerId === 'OTHER'

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Cập nhật giảng viên" subtitle="Thay đổi giảng viên phụ trách cho lớp học phần." />

      <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
        <Card title="Danh sách lớp học phần" description="Chọn lớp cần cập nhật giảng viên">
          {paginatedSections.length > 0 ? (
            <div className="grid gap-4">
              {paginatedSections.map((row) => {
                const isSelected = selectedSectionId === row.section.id
                return (
                  <div key={row.section.id} className={`cursor-pointer rounded-lg border p-4 transition-colors ${isSelected ? 'border-teal-200 bg-teal-50 ring-1 ring-teal-200' : 'hover:border-slate-300'} `} onClick={() => {
                    setSelectedSectionId(row.section.id)
                    setNextLecturerId(row.section.lecturerId ?? '')
                    setNextGuestLecturer(row.section.guestLecturer ?? '')
                  }}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="grid gap-1">
                        <h4 className="font-semibold text-slate-900">{row.section.sectionCode}</h4>
                        <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Thứ {row.section.weekday} - Tiết {row.section.startPeriod}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {row.lecturer?.fullName ?? row.section.guestLecturer ?? '--'}
                          </span>
                        </div>
                      </div>
                      <StatusBadge kind="section" status={row.derivedStatus} />
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">
                  Trang {currentPage} / {totalPages}
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
            </div>
          ) : (
            <EmptyState title="Không có lớp học phần" description="Chưa có lớp học phần nào trong học kỳ hiện tại." />
          )}
        </Card>

        <Card title="Cập nhật giảng viên" description="Xem thông tin lớp và chọn giảng viên mới">
          {selectedSection ? (
            <div className="grid gap-4">
              <InfoList items={[{ label: 'Lớp học phần', value: selectedSection.section.sectionCode }, { label: 'Môn học', value: selectedSection.course?.name ?? selectedSection.section.courseCode }, { label: 'Lịch', value: `Thứ ${selectedSection.section.weekday} - Tiết ${selectedSection.section.startPeriod}` }, { label: 'Giảng viên hiện tại', value: selectedSection.lecturer?.fullName ?? selectedSection.section.guestLecturer ?? '--' }]} />
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Giảng viên mới</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={nextLecturerId}
                  onChange={(e) => setNextLecturerId(e.target.value)}
                >
                  <option value="" disabled>Chọn giảng viên...</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>{lecturer.fullName} ({lecturer.code})</option>
                  ))}
                  <option value="OTHER">Khác (Giảng viên ngoài)</option>
                </select>
              </div>

              {isGuestLecturer && (
                <Input 
                  label="Tên giảng viên khác" 
                  value={nextGuestLecturer} 
                  onChange={(event) => setNextGuestLecturer(event.target.value)} 
                  placeholder="Nhập tên giảng viên"
                />
              )}

              <Button
                onClick={async () => {
                  if (!nextLecturerId) {
                    pushToast({ tone: 'error', title: 'Lỗi', description: 'Vui lòng chọn giảng viên mới.' })
                    return;
                  }
                  if (isGuestLecturer && !nextGuestLecturer) {
                    pushToast({ tone: 'error', title: 'Lỗi', description: 'Vui lòng nhập tên giảng viên khác.' })
                    return;
                  }
                  
                  try {
                    const payload: any = {}
                    if (isGuestLecturer) {
                      payload.guestLecturer = nextGuestLecturer
                    } else {
                      payload.lecturerId = nextLecturerId
                    }

                    await sectionService.assignLecturer(selectedSection.section.id, payload, actor)
                    pushToast({ tone: 'success', title: 'Đã cập nhật giảng viên', description: 'Lớp học phần đã được cập nhật người phụ trách.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể phân công giảng viên', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Phân công
              </Button>
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
