import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { getStudentCurrentCredits, getStudentSemesterEnrollments } from '@/lib/selectors'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { CreditMeter } from '@/components/shared/CreditMeter'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCapacityBar } from '@/components/shared/SectionCapacityBar'
import { StatCard } from '@/components/shared/StatCard'
import { enrollmentService } from '@/services/enrollment.api'
import { registrationService, fetchDepartments, fetchCourseList } from '@/services/registration.api'
import type {
  FilterMode,
  CourseOptionsResponse,
  CourseOption,
  SectionOption,
  RegistrationStatus,
  AcademicStatus,
} from '@/types/registration'
import {
  FILTER_MODE_OPTIONS,
  REGISTRATION_STATUS_LABELS,
  REGISTRATION_STATUS_COLORS,
  ACADEMIC_STATUS_LABELS,
  ACADEMIC_STATUS_COLORS,
} from '@/types/registration'

// ────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5
const DEBOUNCE_MS = 350

// ────────────────────────────────────────────────────────────────────
// Weekday labels (VN convention: 2=Mon, 8=Sun)
// ────────────────────────────────────────────────────────────────────
const WEEKDAY_LABELS: Record<number, string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
}

// ────────────────────────────────────────────────────────────────────
// Status badges
// ────────────────────────────────────────────────────────────────────
function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${REGISTRATION_STATUS_COLORS[status]}`}
    >
      {REGISTRATION_STATUS_LABELS[status]}
    </span>
  )
}

function AcademicStatusBadge({ status }: { status: AcademicStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACADEMIC_STATUS_COLORS[status]}`}
    >
      {ACADEMIC_STATUS_LABELS[status]}
    </span>
  )
}

// ────────────────────────────────────────────────────────────────────
// Section Card
// ────────────────────────────────────────────────────────────────────
function SectionCard({
  section,
  studentId,
  onRegisterSuccess,
}: {
  section: SectionOption
  courseCode: string
  studentId: string
  onRegisterSuccess: () => void
}) {
  const pushToast = useUiStore((s) => s.pushToast)
  const [loadingRegister, setLoadingRegister] = useState(false)

  const schedule = section.schedules[0]
  const scheduleText = schedule
    ? `${WEEKDAY_LABELS[schedule.weekday] ?? `Thứ ${schedule.weekday}`} • Tiết ${schedule.startPeriod}–${schedule.startPeriod + schedule.periodCount - 1} • ${schedule.room} • Tuần ${schedule.weeks}`
    : 'Chưa có lịch'

  const currentEnrollment = useDataStore((s) => 
    s.enrollments.find(
      (e) => e.studentId === studentId && e.sectionId === section.sectionId && ['REGISTERED', 'PENDING', 'WAITLISTED'].includes(e.status)
    )
  )

  const handleRegister = async () => {
    setLoadingRegister(true)
    try {
      const result = await enrollmentService.registerSection(studentId, section.sectionId)
      pushToast({
        tone: result.success ? 'success' : 'error',
        title: result.success ? 'Đã cập nhật đăng ký' : 'Đăng ký thất bại',
        description: result.message,
      })
      if (result.success) {
        onRegisterSuccess()
      }
    } catch {
      pushToast({
        tone: 'error',
        title: 'Lỗi hệ thống',
        description: 'Không thể thực hiện đăng ký. Vui lòng thử lại.',
      })
    } finally {
      setLoadingRegister(false)
    }
  }

  const handleCancel = async () => {
    if (!currentEnrollment) return
    setLoadingRegister(true)
    try {
      await enrollmentService.cancelEnrollment(currentEnrollment.id, undefined, 'Sinh viên tự hủy đăng ký')
      pushToast({
        tone: 'success',
        title: 'Đã hủy đăng ký',
        description: 'Đã hủy đăng ký thành công.',
      })
      onRegisterSuccess() // Refresh list
    } catch {
      pushToast({
        tone: 'error',
        title: 'Lỗi hệ thống',
        description: 'Không thể thực hiện hủy đăng ký. Vui lòng thử lại.',
      })
    } finally {
      setLoadingRegister(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-hairline)] bg-[var(--color-surface)] p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--color-ink)]">{section.sectionCode}</span>
          <RegistrationStatusBadge status={section.registrationStatus} />
        </div>
        <SectionCapacityBar
          capacity={section.capacity}
          registeredCount={section.enrolled}
          waitlistCount={0}
        />
      </div>

      <div className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
        <p>{scheduleText}</p>
        {section.lecturer && <p>GV: {section.lecturer}</p>}
        <p>
          Sĩ số: {section.enrolled}/{section.capacity} • Còn {section.remainingSeats} chỗ
        </p>
      </div>

      {/* Ineligible reasons */}
      {section.registrationStatus !== 'REGISTERED' && !section.eligible && section.ineligibleReasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {section.ineligibleReasons.map((reason, idx) => (
            <div
              key={idx}
              className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700"
            >
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>{reason.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {section.registrationStatus === 'REGISTERED' ? (
          <Button
            loading={loadingRegister}
            onClick={handleCancel}
            type="button"
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Hủy đăng ký
          </Button>
        ) : (
          <Button
            loading={loadingRegister}
            disabled={!section.eligible}
            onClick={handleRegister}
            type="button"
          >
            {section.eligible ? 'Đăng ký ngay' : 'Không đủ điều kiện'}
          </Button>
        )}
        <Link to={`/student/open-sections/${section.sectionId}`}>
          <Button type="button" variant="ghost">
            Xem chi tiết
          </Button>
        </Link>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Course Card (groups sections)
// ────────────────────────────────────────────────────────────────────
function CourseCard({
  course,
  studentId,
  onRegisterSuccess,
}: {
  course: CourseOption
  studentId: string
  onRegisterSuccess: () => void
}) {
  return (
    <div className="rounded-3xl border border-[var(--color-hairline)] bg-white p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-airbnb)]">
      {/* Course header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-[var(--color-ink)]">{course.courseName}</p>
            <AcademicStatusBadge status={course.academicStatus} />
          </div>
          <p className="mt-0.5 text-sm text-[var(--color-muted)]">
            {course.courseCode} • {course.credits} tín chỉ • {course.faculty ?? course.department}
          </p>
          {course.suggestedSemester && (
            <p className="text-xs text-[var(--color-muted)]">CTĐT kỳ {course.suggestedSemester}</p>
          )}
          {course.retakeInfo && (
            <p className="mt-1 text-xs text-red-600">
              Đã học {course.retakeInfo.attemptCount} lần
              {course.retakeInfo.lastGrade && ` • Điểm gần nhất: ${course.retakeInfo.lastGrade}`}
            </p>
          )}
        </div>
        <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]">
          {course.sections.length} lớp
        </span>
      </div>

      {/* Sections */}
      {course.sections.length > 0 && (
        <div className="mt-4 space-y-3">
          {course.sections.map((section) => (
            <SectionCard
              key={section.sectionId}
              section={section}
              courseCode={course.courseCode}
              studentId={studentId}
              onRegisterSuccess={onRegisterSuccess}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Main RegisterPage
// ────────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const snapshot = useDataStore((s) => s)

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>('BY_COURSE')
  const [keyword, setKeyword] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Data state
  const [data, setData] = useState<CourseOptionsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown options (loaded once)
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ value: string; label: string }>>([])
  const [courseOptions, setCourseOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loadingCourses, setLoadingCourses] = useState(false)

  // AbortController ref for cancelling in-flight requests
  const abortRef = useRef<AbortController | null>(null)
  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const student = currentUser
  const studentId = student?.id ?? ''

  // Load departments + courses on mount
  useEffect(() => {
    fetchDepartments().then(setDepartmentOptions)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCourses(true)
    fetchCourseList().then((list) => {
      setCourseOptions(list)
      setLoadingCourses(false)
    })
  }, [])

  // ── Fetch course options from backend ────────────────────────────
  const fetchCourseOptions = useCallback(
    async (overrides?: { mode?: FilterMode; kw?: string; dept?: string; page?: number }) => {
      if (!studentId) return

      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      const mode = overrides?.mode ?? filterMode
      const kw = overrides?.kw ?? keyword
      const dept = overrides?.dept ?? departmentFilter
      const page = overrides?.page ?? currentPage

      setLoading(true)
      setError(null)

      try {
        const query: import('@/types/registration').CourseOptionsQuery = {
          mode,
          studentId,
          page,
          limit: PAGE_SIZE,
        }
        if (kw) {
          query.keyword = kw
          if (mode === 'BY_SECTION') query.sectionCode = kw
        }
        // BY_COURSE: use selectedCourse or keyword
        if (mode === 'BY_COURSE') {
          const courseVal = selectedCourse || kw
          if (courseVal) query.courseCode = courseVal
          if (kw) query.keyword = kw
        }
        if (mode === 'BY_DEPARTMENT' && dept) {
          query.department = dept
        }

        const result = await registrationService.getCourseOptions(
          query,
          controller.signal,
        )
        setData(result)
      } catch (err: unknown) {
        // Ignore aborted requests
        if (err?.name === 'AbortError') return
        const message =
          err instanceof Error ? err.message : 'Không thể tải dữ liệu. Vui lòng thử lại.'
        setError(message)
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [studentId, filterMode, keyword, departmentFilter, selectedCourse, currentPage],
  )

  // ── Trigger API on mode/filter changes ───────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchCourseOptions()
    // Cleanup: abort on unmount
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMode, departmentFilter, selectedCourse, currentPage])

  // ── Debounced keyword search ─────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCourseOptions({ kw: keyword })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword])

  // ── Handler: mode change ─────────────────────────────────────────
  const handleModeChange = (nextMode: FilterMode) => {
    setFilterMode(nextMode)
    setKeyword('')
    setDepartmentFilter('')
    setSelectedCourse('')
    setCurrentPage(1)
    setData(null)
  }

  // ── Handler: after successful registration → refetch ─────────────
  const handleRegisterSuccess = () => {
    fetchCourseOptions()
  }

  // ── Derived stats ────────────────────────────────────────────────
  const currentCredits = student ? getStudentCurrentCredits(snapshot, student.id) : 0
  const currentEnrollments = student ? getStudentSemesterEnrollments(snapshot, student.id) : []
  const registeredCount = currentEnrollments.filter((e) => e.enrollment.status === 'REGISTERED').length
  const waitlistedCount = currentEnrollments.filter((e) => e.enrollment.status === 'WAITLISTED').length

  // ── Pagination ───────────────────────────────────────────────────
  const totalCourses = data?.pagination?.total ?? data?.courses?.length ?? 0
  const totalPages = data?.pagination?.totalPages ?? Math.ceil(totalCourses / PAGE_SIZE)
  const totalSections = data?.courses?.reduce((sum, c) => sum + c.sections.length, 0) ?? 0

  // ── Filter info badge ────────────────────────────────────────────
  function getFilterDescription(): string {
    switch (filterMode) {
      case 'BY_COURSE':
        return keyword ? `Tìm kiếm: "${keyword}"` : 'Nhập mã hoặc tên môn để tìm'
      case 'OPEN_FOR_STUDENT_CLASS':
        return `Lớp ${data?.student?.studentClass?.code ?? student?.studentClass ?? 'N/A'}`
      case 'CURRICULUM_PLAN':
        return `Các môn đúng tiến độ CTĐT`
      case 'NOT_STUDIED_IN_CURRICULUM':
        return 'Các môn còn thiếu chưa hoàn thành'
      case 'FAILED_COURSES':
        return `${totalCourses} môn cần học lại`
      case 'BY_DEPARTMENT':
        return departmentFilter || 'Chọn khoa để lọc'
      case 'BY_SECTION':
        return keyword ? `Tìm: "${keyword}"` : 'Nhập mã lớp học phần để tìm'
      default:
        return ''
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  if (!student) {
    return (
      <EmptyState
        title="Không tìm thấy sinh viên"
        description="Vui lòng đăng nhập lại."
      />
    )
  }

  return (
    <div className="grid gap-10">
      <PageTitleBlock
        title="Sinh viên - Đăng ký học phần"
        subtitle="Kiểm tra điều kiện theo từng quy tắc học vụ, theo dõi credit meter và gửi đăng ký theo section."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CreditMeter
          current={currentCredits}
          min={snapshot.settings.minCredits}
          max={
            snapshot.settings.semesterType === 'SUMMER'
              ? snapshot.settings.maxCreditsSummer
              : snapshot.settings.maxCreditsMain
          }
        />
        <StatCard
          label="Lớp đang học"
          value={String(registeredCount)}
          hint="Số lớp đã đăng ký thành công"
        />
        <StatCard
          label="Đang ở danh sách chờ"
          value={String(waitlistedCount)}
          hint="Số lớp chờ xếp chỗ do hết slot"
        />
        <StatCard
          label="Tổng lớp hiển thị"
          value={String(totalSections)}
          hint="Lớp học phần phù hợp với bộ lọc"
        />
      </div>

      {/* Main content */}
      <Card
        title="Bảng chọn lớp học phần"
        description="Chọn chế độ lọc, kiểm tra điều kiện và đăng ký trực tiếp"
      >
        {/* ── Filters ──────────────────────────────────────── */}
        <div className="mb-6 grid items-end gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {/* Row 1: Student class + Filter mode */}
          
          <div className="flex h-[58px] min-w-0 items-center gap-3 rounded-full border border-[var(--color-hairline)] bg-white px-4 py-2 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-muted)]">Lớp sinh viên</p>
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {student.studentClass ?? 'Chưa xác định'}
              </p>
            </div>
          </div>

          <div className="min-w-0">
            <Select
              label="Chế độ lọc"
              value={filterMode}
              onChange={(e) => handleModeChange(e.target.value as FilterMode)}
              options={FILTER_MODE_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            />
          </div>

          {/* Mode-specific sub-filters */}
          {filterMode === 'BY_COURSE' && (
            <>
              <div className="min-w-0">
                <Select
                  label="Chọn môn học"
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value)
                    setKeyword('')
                    setCurrentPage(1)
                  }}
                  options={[
                    { label: loadingCourses ? 'Đang tải danh sách...' : '-- Tất cả môn học --', value: '' },
                    ...courseOptions,
                  ]}
                />
              </div>
              <div className="min-w-0">
                <SearchInput
                  label="Hoặc tìm theo mã / tên môn"
                  placeholder="Nhập mã hoặc tên môn học..."
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value)
                    setSelectedCourse('')
                    setCurrentPage(1)
                  }}
                />
              </div>
            </>
          )}

          {filterMode === 'BY_SECTION' && (
            <div className="min-w-0">
              <SearchInput
                label="Tìm theo mã lớp học phần"
                placeholder="Nhập mã lớp học phần..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          )}

          {filterMode === 'BY_DEPARTMENT' && (
            <div className="min-w-0">
              <Select
                label="Chọn khoa quản lý"
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value)
                  setCurrentPage(1)
                }}
                options={[
                  { label: 'Tất cả khoa', value: '' },
                  ...departmentOptions,
                ]}
              />
            </div>
          )}
        </div>

        {/* ── Filter info badge ────────────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700">
            {FILTER_MODE_OPTIONS.find((o) => o.value === filterMode)?.label}
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-muted)]">
            {getFilterDescription()}
          </span>
          {data && (
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]">
              {totalCourses} môn • {totalSections} lớp
            </span>
          )}
          {data?.term && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              {data.term.name}
            </span>
          )}
        </div>

        {/* ── Loading state ─────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-200 border-t-cyan-600" />
            <span className="ml-3 text-sm text-[var(--color-muted)]">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────── */}
        {error && !loading && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={() => fetchCourseOptions()}
              type="button"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* ── Data display ────────────────────────────────── */}
        {!loading && !error && data && data.courses.length > 0 && (
          <div className="space-y-4">
            {data.courses.map((course) => (
              <CourseCard
                key={course.courseId}
                course={course}
                studentId={studentId}
                onRegisterSuccess={handleRegisterSuccess}
              />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-6 py-4 shadow-sm">
                <p className="text-sm text-[var(--color-muted)]">
                  Trang{' '}
                  <span className="font-medium text-[var(--color-ink)]">{currentPage}</span> /{' '}
                  <span className="font-medium text-[var(--color-ink)]">{totalPages}</span>
                  {' '}• Tổng {totalCourses} môn
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 text-sm font-medium text-[var(--color-ink)]">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ──────────────────────────────────── */}
        {!loading && !error && data && data.courses.length === 0 && (
          <EmptyState
            title="Không có lớp học phần phù hợp"
            description={
              filterMode === 'FAILED_COURSES'
                ? 'Không có môn nào cần học lại. Chúc mừng bạn!'
                : filterMode === 'NOT_STUDIED_IN_CURRICULUM'
                  ? 'Bạn đã hoàn thành tất cả các môn theo CTĐT đến kỳ hiện tại.'
                  : 'Hãy đổi chế độ lọc hoặc từ khóa tìm kiếm để xem danh sách khác.'
            }
          />
        )}

        {/* ── Initial state (no data yet) ──────────────────── */}
        {!loading && !error && !data && (
          <EmptyState
            title="Chọn chế độ lọc"
            description="Hãy chọn chế độ lọc ở trên để xem danh sách lớp học phần."
          />
        )}
      </Card>
    </div>
  )
}

export default RegisterPage
