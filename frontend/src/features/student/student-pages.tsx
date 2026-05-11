import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import { formatDateTime } from '@/lib/date'
import { getCurrentSemesterSections, getStudentCurrentCredits, getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Dialog } from '@/components/ui/Dialog'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { CreditMeter } from '@/components/shared/CreditMeter'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { FilterBar } from '@/components/shared/FilterBar'
import { InfoList } from '@/components/shared/InfoList'
import { RuleCheckPanel } from '@/components/shared/RuleCheckPanel'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCapacityBar } from '@/components/shared/SectionCapacityBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimelineList } from '@/components/shared/TimelineList'
import { WeekCalendarGrid } from '@/components/calendar/WeekCalendarGrid'
import { SemesterScheduleTable } from '@/components/calendar/SemesterScheduleTable'
import { enrollmentService } from '@/services/enrollment.api'
import { courseService } from '@/services/course.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
import { getStudentScheduleEntries } from '@/lib/selectors'
import type { Course } from '@/types/course'
import type { User } from '@/types/user'

function useStudentContext() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const pushToast = useUiStore((state) => state.pushToast)

  useEffect(() => {
    if (!currentUser?.roles.includes('STUDENT')) {
      return
    }

    void courseService.listCourses().catch(() => undefined)
    void sectionService.listSections().catch(() => undefined)
    void enrollmentService.listHistory(currentUser.id).catch(() => undefined)
    void wishService.listWishes({ studentId: currentUser.id }).catch(() => undefined)
  }, [currentUser?.id, currentUser?.roles])

  return {
    currentUser,
    snapshot,
    pushToast,
    actor: currentUser
      ? { actorId: currentUser.id, actorRole: currentUser.roles[0] ?? 'STUDENT' }
      : null,
  }
}

interface RegistrationClassScope {
  classCode: string
  program?: string
  faculty?: string
}

function normalizeLookupValue(value?: string | null) {
  return (value ?? '').trim().toUpperCase()
}

function inferRegistrationClassScope(classCode: string, users: User[]): RegistrationClassScope {
  const normalizedClassCode = normalizeLookupValue(classCode)

  if (!normalizedClassCode) {
    return { classCode: '' }
  }

  const matchedStudent = users.find(
    (user) =>
      user.roles.includes('STUDENT') &&
      normalizeLookupValue(user.studentClass) === normalizedClassCode,
  )

  if (matchedStudent) {
    const matchedProgram = matchedStudent.majorName ?? matchedStudent.program
    const matchedFaculty = matchedStudent.faculty ?? matchedStudent.department
    return {
      classCode: matchedStudent.studentClass ?? classCode,
      ...(matchedProgram ? { program: matchedProgram } : {}),
      ...(matchedFaculty ? { faculty: matchedFaculty } : {}),
    }
  }

  if (['ATTT', 'DCAT', 'CQAT'].some((token) => normalizedClassCode.includes(token))) {
    return {
      classCode,
      program: 'An toàn thông tin',
      faculty: 'Khoa An toàn thông tin',
    }
  }

  if (['CNTT', 'DCCN', 'CQCN'].some((token) => normalizedClassCode.includes(token))) {
    return {
      classCode,
      program: 'Công nghệ thông tin',
      faculty: 'Khoa Công nghệ thông tin',
    }
  }

  return { classCode }
}

function courseMatchesRegistrationClass(course: Course | null, scope: RegistrationClassScope) {
  if (!course || !scope.program) {
    return true
  }

  const supportedMajors = course.majorsSupported ?? []
  if (!supportedMajors.length) {
    return true
  }

  return supportedMajors.includes(scope.program)
}

function courseMatchesManagingFaculty(course: Course | null, facultyFilter: string) {
  if (!facultyFilter || !course) {
    return true
  }

  const courseFaculty = course.faculty ?? course.department
  return courseFaculty === facultyFilter
}

export function OpenSectionsPage() {
  const navigate = useNavigate()
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [submittingId, setSubmittingId] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const rows = getCurrentSemesterSections(snapshot).filter((item) => {
    const keyword = query.toLowerCase()
    const matchesQuery =
      !query ||
      item.section.sectionCode.toLowerCase().includes(keyword) ||
      item.section.courseCode.toLowerCase().includes(keyword) ||
      item.course?.name.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter === 'ALL' || item.derivedStatus === statusFilter
    return matchesQuery && matchesStatus
  })

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'sectionCode', header: 'Mã lớp HP', render: (row) => <span className="font-medium text-slate-900">{row.section.sectionCode}</span> },
    { key: 'courseCode', header: 'Mã MH', render: (row) => row.section.courseCode },
    { key: 'courseName', header: 'Tên môn học', render: (row) => row.course?.name ?? '--' },
    { key: 'credits', header: 'Tín chỉ', render: (row) => String(row.course?.credits ?? '--') },
    { key: 'time', header: 'Lịch học', render: (row) => `Thứ ${row.section.weekday} • Tiết ${row.section.startPeriod}` },
    { key: 'lecturer', header: 'Giảng viên', render: (row) => row.lecturer?.fullName ?? '--' },
    { key: 'capacity', header: 'Sĩ số', render: (row) => <SectionCapacityBar capacity={row.section.capacity} registeredCount={row.section.registeredCount} waitlistCount={row.section.waitlistCount} /> },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="section" status={row.derivedStatus} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => navigate(`/student/open-sections/${row.section.id}`)} type="button">
            Xem chi tiết
          </Button>
          <Button
            loading={submittingId === row.section.id}
            onClick={async () => {
              if (snapshot.settings.maintenanceMode) {
                pushToast({ tone: 'warning', title: 'Hệ thống đang bảo trì', description: snapshot.settings.maintenanceMessage })
                return
              }

              setSubmittingId(row.section.id)
              const result = await enrollmentService.registerSection(student.id, row.section.id, auditActor)
              setSubmittingId('')
                pushToast({
                  tone: result.success ? 'success' : 'error',
                  title: result.success ? 'Đã gửi yêu cầu đăng ký' : 'Không thể đăng ký',
                  description: result.message,
                })
            }}
            type="button"
          >
            Đăng ký nhanh
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Danh sách học phần mở"
        subtitle="Tra cứu các lớp học phần đang mở trong học kỳ hiện tại, kèm sĩ số, danh sách chờ và thao tác đăng ký nhanh."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Tổng lớp mở" value={String(rows.length)} hint="Sau khi đã lọc" />
        <StatCard label="Còn chỗ" value={String(rows.filter((row) => row.availableSeats > 0).length)} hint="Có thể đăng ký trực tiếp" />
        <StatCard label="Có danh sách chờ" value={String(rows.filter((row) => row.section.allowWaitlist).length)} hint="Cho phép vào danh sách chờ" />
        <StatCard label="Tổng tín chỉ có thể chọn" value={String(rows.reduce((sum, row) => sum + (row.course?.credits ?? 0), 0))} hint="Tổng tín chỉ của danh sách hiện tại" />
      </div>

      <FilterBar
        actions={
          <ExportButtons
            fileName="student-open-sections.csv"
            rows={rows.map((row) => ({
              ma_lop_hp: row.section.sectionCode,
              ma_mon: row.section.courseCode,
              ten_mon_hoc: row.course?.name ?? '',
              tin_chi: row.course?.credits ?? '',
              giang_vien: row.lecturer?.fullName ?? '',
              trang_thai: row.derivedStatus,
            }))}
          />
        }
      >
        <SearchInput label="Tìm kiếm môn học / lớp HP" placeholder="INT2102, an toàn mạng..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Input label="Trạng thái" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} list="section-status-list" />
      </FilterBar>
      <datalist id="section-status-list">
        <option value="ALL" />
        <option value="OPEN" />
        <option value="FULL" />
        <option value="CLOSED" />
      </datalist>

      {rows.length ? <Table columns={columns} rows={rows} rowKey={(row) => row.section.id} /> : <EmptyState title="Không có lớp phù hợp" description="Hãy đổi bộ lọc hoặc tìm kiếm bằng mã môn học, tên môn học." />}
    </div>
  )
}

export function CourseDetailPage() {
  const { sectionId } = useParams()
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [loading, setLoading] = useState(false)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const section = snapshot.sections.find((item) => item.id === sectionId)
  const course = snapshot.courses.find((item) => item.code === section?.courseCode)
  const lecturer = snapshot.users.find((item) => item.id === section?.lecturerId)

  if (!section || !course) {
    return <ErrorState title="Không tìm thấy học phần" description="Bản ghi lớp học phần không tồn tại hoặc đã bị xóa khỏi dữ liệu mô phỏng." />
  }

  const eligibility = evaluateEnrollmentEligibility({
    nowIso: snapshot.settings.simulationNow,
    student,
    section,
    targetCourse: course,
    courses: snapshot.courses,
    sections: snapshot.sections,
    enrollments: snapshot.enrollments,
    settings: snapshot.settings,
  })

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Chi tiết học phần"
        subtitle="Xem đầy đủ thông tin lớp học phần, quy tắc tiên quyết và kết quả kiểm tra điều kiện trước khi đăng ký."
        actions={
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true)
              const result = await enrollmentService.registerSection(student.id, section.id, auditActor)
              setLoading(false)
              pushToast({
                tone: result.success ? 'success' : 'error',
                title: result.success ? 'Đăng ký thành công' : 'Đăng ký thất bại',
                description: result.message,
              })
            }}
            type="button"
          >
            Đăng ký
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
        <Card title={`${course.name} (${section.sectionCode})`} description="Thông tin tổng quan, lịch học và phạm vi áp dụng">
          <InfoList
            items={[
              { label: 'Mã môn học', value: course.code },
              { label: 'Tín chỉ', value: String(course.credits) },
              { label: 'Loại môn', value: course.courseType ?? 'Chưa phân loại' },
              { label: 'Khối kiến thức', value: course.academicBlock ?? 'Danh mục chung' },
              { label: 'Học kỳ gợi ý', value: course.suggestedSemester ? `Học kỳ ${course.suggestedSemester}` : 'Đang cập nhật' },
              { label: 'Ngành áp dụng', value: course.majorsSupported?.join(', ') || 'Danh mục chung' },
              { label: 'Giảng viên', value: lecturer?.fullName ?? '--' },
              { label: 'Phòng học', value: section.room },
              { label: 'Lịch học', value: `Thứ ${section.weekday} • Tiết ${section.startPeriod}-${section.startPeriod + section.periodCount - 1}` },
              { label: 'Tuần học', value: section.weeks },
              { label: 'Tiên quyết', value: course.prerequisites.join(', ') || 'Không có' },
              { label: 'Học trước', value: course.prestudy.join(', ') || 'Không có' },
              { label: 'Song hành', value: course.corequisites.join(', ') || 'Không có' },
            ]}
          />
        </Card>

        <RuleCheckPanel checks={eligibility.checks} summary={eligibility.message} />
      </div>
    </div>
  )
}

export function RegisterPage() {
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState(currentUser?.studentClass ?? '')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [checkResult, setCheckResult] = useState<ReturnType<typeof evaluateEnrollmentEligibility> | null>(null)
  const [checkingId, setCheckingId] = useState('')
  const [loadingId, setLoadingId] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor
  const classScope = inferRegistrationClassScope(classFilter, snapshot.users)
  const classOptions = Array.from(
    new Set(
      snapshot.users
        .filter((user) => user.roles.includes('STUDENT'))
        .map((user) => user.studentClass)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right, 'vi'))
  const facultyOptions = Array.from(
    new Set(
      snapshot.courses
        .map((course) => course.faculty ?? course.department)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right, 'vi'))

  const sectionRows = getCurrentSemesterSections(snapshot).filter((item) => {
    const keyword = query.toLowerCase()
    const matchesQuery =
      !query ||
      item.section.courseCode.toLowerCase().includes(keyword) ||
      item.section.sectionCode.toLowerCase().includes(keyword) ||
      item.course?.name.toLowerCase().includes(keyword)
    const matchesClass = courseMatchesRegistrationClass(item.course, classScope)
    const matchesFaculty = courseMatchesManagingFaculty(item.course, facultyFilter)

    return matchesQuery && matchesClass && matchesFaculty
  })

  const currentCredits = getStudentCurrentCredits(snapshot, student.id)
  const currentEnrollments = getStudentSemesterEnrollments(snapshot, student.id)

  async function handleCheck(sectionId: string) {
    const section = snapshot.sections.find((item) => item.id === sectionId)
    const targetCourse = snapshot.courses.find((item) => item.code === section?.courseCode)
    if (!section || !targetCourse) {
      return
    }

    const result = evaluateEnrollmentEligibility({
      nowIso: snapshot.settings.simulationNow,
      student,
      section,
      targetCourse,
      courses: snapshot.courses,
      sections: snapshot.sections,
      enrollments: snapshot.enrollments,
      settings: snapshot.settings,
    })
    setSelectedSectionId(sectionId)
    setCheckResult(result)

    setCheckingId(sectionId)
    const apiResult = await enrollmentService.checkEligibility(student.id, sectionId)
    setCheckingId('')
    setCheckResult(apiResult)
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Đăng ký học phần"
        subtitle="Kiểm tra điều kiện theo từng quy tắc học vụ, theo dõi credit meter và gửi đăng ký theo section."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <CreditMeter current={currentCredits} min={snapshot.settings.minCredits} max={snapshot.settings.maxCredits} />
        <StatCard label="Lớp đang học" value={String(currentEnrollments.filter((item) => item.enrollment.status === 'REGISTERED').length)} hint="DK_TC trong học kỳ hiện tại" />
        <StatCard label="Đang ở danh sách chờ" value={String(currentEnrollments.filter((item) => item.enrollment.status === 'WAITLISTED').length)} hint="Theo dõi nội bộ, khi đối chiếu PDF quy về KHONG_DU_DK" />
        <StatCard label="Cảnh báo" value={checkResult?.checks.filter((item) => !item.passed).length ? String(checkResult.checks.filter((item) => !item.passed).length) : '0'} hint="Số rule fail của section đang xem" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.62fr_0.38fr]">
        <Card title="Bảng chọn lớp học phần" description="Sử dụng tìm kiếm, lọc theo lớp sinh viên, khoa quản lý, kiểm tra điều kiện và đăng ký trực tiếp">
          <div className="mb-4 grid gap-3 xl:grid-cols-3">
            <SearchInput label="Tìm theo mã / tên môn học" placeholder="Nhập từ khóa..." value={query} onChange={(event) => setQuery(event.target.value)} />
            <Input
              label="Lớp sinh viên"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              list="student-class-filter-list"
              placeholder={student.studentClass ?? 'D23CQCN01-N'}
            />
            <Input
              label="Khoa quản lý"
              value={facultyFilter}
              onChange={(event) => setFacultyFilter(event.target.value)}
              list="registration-faculty-filter-list"
              placeholder="Tất cả khoa"
            />
          </div>
          <datalist id="student-class-filter-list">
            {classOptions.map((classCode) => (
              <option key={classCode} value={classCode} />
            ))}
          </datalist>
          <datalist id="registration-faculty-filter-list">
            {facultyOptions.map((faculty) => (
              <option key={faculty} value={faculty} />
            ))}
          </datalist>
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
              Lớp áp dụng: {classFilter.trim() ? classFilter : 'Tất cả lớp'}
            </span>
            <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-700">
              Ngành suy luận: {classFilter.trim() ? classScope.program ?? 'Cần rà soát' : 'Không ràng buộc'}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
              Khoa quản lý: {facultyFilter.trim() ? facultyFilter : 'Tất cả khoa'}
            </span>
          </div>
          {sectionRows.length ? (
            <div className="space-y-3">
              {sectionRows.map((row) => (
                <div key={row.section.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{row.course?.name ?? row.section.sectionCode}</p>
                      <p className="text-sm text-slate-500">{row.section.sectionCode} • {row.section.courseCode} • {row.course?.credits ?? '--'} tín chỉ</p>
                      <p className="text-xs text-slate-500">
                        {row.course?.courseType ?? 'Danh mục chung'} • {row.course?.majorsSupported?.join(', ') ?? 'Áp dụng chung'} • {row.course?.faculty ?? row.course?.department ?? 'Đang cập nhật khoa'}
                      </p>
                    </div>
                    <StatusBadge kind="section" status={row.derivedStatus} />
                  </div>
                  <div className="mt-3">
                    <SectionCapacityBar capacity={row.section.capacity} registeredCount={row.section.registeredCount} waitlistCount={row.section.waitlistCount} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      loading={checkingId === row.section.id}
                      variant="secondary"
                      onClick={() => void handleCheck(row.section.id)}
                      type="button"
                    >
                      Kiểm tra điều kiện
                    </Button>
                    <Button
                      loading={loadingId === row.section.id}
                      onClick={async () => {
                        setLoadingId(row.section.id)
                        const result = await enrollmentService.registerSection(student.id, row.section.id, auditActor)
                        setLoadingId('')
                        pushToast({
                          tone: result.success ? 'success' : 'error',
                          title: result.success ? 'Đã cập nhật đăng ký' : 'Đăng ký thất bại',
                          description: result.message,
                        })
                        void handleCheck(row.section.id)
                      }}
                      type="button"
                    >
                      Đăng ký ngay
                    </Button>
                    <Link to={`/student/open-sections/${row.section.id}`}>
                      <Button type="button" variant="ghost">
                        Xem chi tiết
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Không có lớp học phần phù hợp" description="Hãy đổi lớp sinh viên, khoa quản lý hoặc từ khóa tìm kiếm để xem danh sách khác." />
          )}
        </Card>

        {checkResult && selectedSectionId ? (
          <RuleCheckPanel
            title={`Lớp đang xem: ${snapshot.sections.find((item) => item.id === selectedSectionId)?.sectionCode ?? selectedSectionId}`}
            checks={checkResult.checks}
            summary={checkResult.message}
          />
        ) : (
          <EmptyState title="Chưa chọn section" description="Hãy bấm Kiểm tra điều kiện ở bảng bên trái để xem kết quả chi tiết." />
        )}
      </div>
    </div>
  )
}

export function CancelRegistrationPage() {
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const rows = getStudentSemesterEnrollments(snapshot, student.id).filter((item) =>
    ['REGISTERED', 'WAITLISTED'].includes(item.enrollment.status),
  )
  const selected = rows.find((item) => item.enrollment.id === selectedEnrollmentId)

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Hủy đăng ký học phần" subtitle="Chỉ cho phép thao tác trong cửa sổ điều chỉnh và cập nhật lại sĩ số lớp học phần." />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Có thể hủy" value={String(rows.length)} hint="DK_TC hoặc bản ghi chờ nội bộ" />
        <StatCard label="Hạn điều chỉnh" value={snapshot.settings.adjustmentEnd.slice(0, 10)} hint="Hạn cuối hiện tại" />
        <StatCard label="Tín chỉ đang ảnh hưởng" value={String(rows.reduce((sum, item) => sum + (item.course?.credits ?? 0), 0))} hint="Tổng tín chỉ của danh sách hủy" />
      </div>

      {rows.length ? (
        <Card title="Danh sách đăng ký hiện tại" description="Chọn học phần để hủy và ghi lại lý do nếu cần">
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{row.course?.name ?? row.section?.sectionCode}</p>
                  <p className="text-sm text-slate-500">
                    {row.section?.sectionCode} • {row.section?.courseCode} • Đăng ký lúc {formatDateTime(row.enrollment.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge kind="enrollment" status={row.enrollment.status} />
                  <Button onClick={() => setSelectedEnrollmentId(row.enrollment.id)} type="button" variant="danger">
                    Hủy đăng ký
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState title="Không có học phần để hủy" description="Danh sách hiện tại không có bản ghi đăng ký hợp lệ hoặc đang chờ xử lý để hủy." />
      )}

      <ConfirmDialog
        open={Boolean(selected)}
        title="Xác nhận hủy đăng ký"
        description="Thao tác này chỉ hợp lệ trong cửa sổ điều chỉnh và sẽ cập nhật lại sĩ số lớp học phần."
        confirmLabel="Hủy học phần"
        danger
        loading={loading}
        onClose={() => {
          setSelectedEnrollmentId('')
          setReason('')
        }}
        onConfirm={async () => {
          if (!selected) {
            return
          }
          setLoading(true)
          try {
            await enrollmentService.cancelEnrollment(selected.enrollment.id, auditActor, reason || undefined)
            pushToast({ tone: 'success', title: 'Đã hủy đăng ký', description: 'Bản ghi đăng ký đã chuyển sang HUY_DK.' })
            setSelectedEnrollmentId('')
            setReason('')
          } catch (error) {
            pushToast({ tone: 'error', title: 'Không thể hủy đăng ký', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu.' })
          } finally {
            setLoading(false)
          }
        }}
      >
        <Textarea label="Lý do hủy (không bắt buộc)" value={reason} onChange={(event) => setReason(event.target.value)} />
      </ConfirmDialog>
    </div>
  )
}

export function WithdrawPage() {
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const rows = getStudentSemesterEnrollments(snapshot, student.id).filter((item) => item.enrollment.status === 'REGISTERED')
  const selected = rows.find((item) => item.enrollment.id === selectedEnrollmentId)

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Rút học phần" subtitle="Rút học phần sau giai đoạn điều chỉnh và trước hạn rút học phần; khi hiển thị theo PDF sẽ quy về HUY_DK." />

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Có thể rút" value={String(rows.length)} hint="Chỉ áp dụng cho DK_TC" />
        <StatCard label="Hạn rút học phần" value={snapshot.settings.withdrawalDeadline.slice(0, 10)} hint="Hạn cuối hệ thống" />
        <StatCard label="Tín chỉ ảnh hưởng" value={String(rows.reduce((sum, item) => sum + (item.course?.credits ?? 0), 0))} hint="Tổng tín chỉ có thể bị giảm" />
      </div>

      {rows.length ? (
        <Card title="Danh sách học phần đang học" description="Rút học phần sẽ giữ lịch sử và tạo nhật ký hệ thống">
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{row.course?.name ?? row.section?.sectionCode}</p>
                  <p className="text-sm text-slate-500">{row.section?.sectionCode} • Rút trước {snapshot.settings.withdrawalDeadline.slice(0, 10)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge kind="enrollment" status={row.enrollment.status} />
                  <Button onClick={() => setSelectedEnrollmentId(row.enrollment.id)} type="button" variant="danger">
                    Rút học phần
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState title="Không có học phần để rút" description="Chỉ những bản ghi DK_TC mới có thể rút." />
      )}

      <ConfirmDialog
        open={Boolean(selected)}
        title="Xác nhận rút học phần"
        description="Trạng thái nội bộ sẽ được lưu lịch sử và hiển thị theo quy ước PDF là HUY_DK."
        confirmLabel="Rút học phần"
        danger
        loading={loading}
        onClose={() => {
          setSelectedEnrollmentId('')
          setReason('')
        }}
        onConfirm={async () => {
          if (!selected || !reason.trim()) {
            pushToast({ tone: 'warning', title: 'Thiếu lý do rút học phần', description: 'Vui lòng nhập lý do để tiếp tục thao tác.' })
            return
          }
          setLoading(true)
          try {
            await enrollmentService.withdrawEnrollment(selected.enrollment.id, reason, auditActor)
            pushToast({ tone: 'success', title: 'Rút học phần thành công', description: 'Bản ghi đã được hiển thị theo quy ước HUY_DK.' })
            setSelectedEnrollmentId('')
            setReason('')
          } catch (error) {
            pushToast({ tone: 'error', title: 'Không thể rút học phần', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
          } finally {
            setLoading(false)
          }
        }}
      >
        <Textarea label="Lý do rút học phần" value={reason} onChange={(event) => setReason(event.target.value)} />
      </ConfirmDialog>
    </div>
  )
}

export function WeekSchedulePage() {
  const { currentUser, snapshot } = useStudentContext()
  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const entries = getStudentScheduleEntries(snapshot, student.id)
  const morning = entries.filter((entry) => entry.startPeriod <= 4).length
  const afternoon = entries.filter((entry) => entry.startPeriod >= 5 && entry.startPeriod <= 8).length
  const evening = entries.filter((entry) => entry.startPeriod > 8).length

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Thời khóa biểu dạng tuần" subtitle="Hiển thị lịch học theo ngày và khung giờ, ưu tiên bố cục trực quan để đối chiếu nhanh trong tuần." />
      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Tổng buổi" value={String(entries.length)} hint="Tất cả buổi học trong học kỳ hiện tại" />
        <StatCard label="Buổi sáng" value={String(morning)} hint="Tiết 1-4" />
        <StatCard label="Buổi chiều" value={String(afternoon)} hint="Tiết 5-8" />
        <StatCard label="Buổi tối" value={String(evening)} hint="Tiết 9-10" />
      </div>
      <WeekCalendarGrid entries={entries} />
    </div>
  )
}

export function SemesterSchedulePage() {
  const { currentUser, snapshot } = useStudentContext()
  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const entries = getStudentScheduleEntries(snapshot, student.id)

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Thời khóa biểu dạng học kỳ" subtitle="Bảng tổng hợp học phần đang học để đối chiếu lịch, in ấn và rà soát phòng học trong toàn học kỳ." />
      <Card title="Bảng lịch học kỳ" description="Tổng hợp theo môn học, lớp học phần, tiết học, phòng và giảng viên phụ trách">
        {entries.length ? <SemesterScheduleTable entries={entries} /> : <EmptyState title="Chưa có lịch học" description="Không có buổi học DK_TC nào để hiển thị." />}
      </Card>
    </div>
  )
}

export function HistoryPage() {
  const { currentUser, snapshot } = useStudentContext()
  const [selectedId, setSelectedId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const rows = getStudentSemesterEnrollments(snapshot, student.id).filter((item) =>
    statusFilter === 'ALL' ? true : item.enrollment.status === statusFilter,
  )
  const selected = rows.find((item) => item.enrollment.id === selectedId)

  const columns: TableColumn<(typeof rows)[number]>[] = [
    {
      key: 'semester',
      header: 'Học kỳ',
      render: (row) =>
        snapshot.semesters.find((semester) => semester.id === row.enrollment.semesterId)?.label ??
        row.enrollment.semesterId,
    },
    { key: 'courseCode', header: 'Mã MH', render: (row) => row.section?.courseCode ?? '--' },
    { key: 'courseName', header: 'Tên môn học', render: (row) => row.course?.name ?? '--' },
    { key: 'sectionCode', header: 'Mã lớp HP', render: (row) => row.section?.sectionCode ?? '--' },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="enrollment" status={row.enrollment.status} /> },
    { key: 'createdAt', header: 'Ngày đăng ký', render: (row) => formatDateTime(row.enrollment.createdAt) },
    {
      key: 'action',
      header: 'Nhật ký',
      render: (row) => (
        <Button variant="ghost" onClick={() => setSelectedId(row.enrollment.id)} type="button">
          Xem timeline
        </Button>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Lịch sử đăng ký học phần" subtitle="Tra cứu toàn bộ timeline thay đổi trạng thái trong học kỳ, chỉ ở chế độ chỉ đọc." />
      <FilterBar>
        <Input label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} list="enrollment-status-list" />
      </FilterBar>
      <datalist id="enrollment-status-list">
        <option value="ALL" />
        <option value="REGISTERED">DK_TC</option>
        <option value="WAITLISTED">KHONG_DU_DK</option>
        <option value="CANCELLED">HUY_DK</option>
        <option value="DROPPED">HUY_DK</option>
        <option value="REJECTED">KHONG_DU_DK</option>
      </datalist>
      <Table columns={columns} rows={rows} rowKey={(row) => row.enrollment.id} />
      <Dialog open={Boolean(selected)} title="Timeline đăng ký" description="Chỉ để tra cứu, không cho phép chỉnh sửa." onClose={() => setSelectedId('')}>
        {selected ? <TimelineList items={selected.enrollment.timeline} /> : null}
      </Dialog>
    </div>
  )
}

export function PrerequisitePage() {
  const { snapshot } = useStudentContext()
  const [query, setQuery] = useState('')

  const rows = snapshot.courseRelations.filter((item) => {
    if (!query) {
      return true
    }

    const keyword = query.toLowerCase()
    return item.courseCode.toLowerCase().includes(keyword) || item.courseName.toLowerCase().includes(keyword)
  })

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'course', header: 'Môn đăng ký', render: (row) => `${row.courseCode} - ${row.courseName}` },
    { key: 'required', header: 'Môn yêu cầu', render: (row) => `${row.requiredCourseCode} - ${row.requiredCourseName}` },
    { key: 'type', header: 'Loại quan hệ', render: (row) => row.relationType },
    { key: 'program', header: 'Hệ đào tạo', render: (row) => row.program },
    { key: 'department', header: 'Khoa', render: (row) => row.department },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Xem môn tiên quyết" subtitle="Tra cứu các quan hệ prerequisite, prestudy và corequisite cho các học phần trong catalog." />
      <FilterBar>
        <SearchInput label="Tìm theo mã / tên môn học" placeholder="SEC2201..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </FilterBar>
      <Table columns={columns} rows={rows} rowKey={(row) => row.id} />
    </div>
  )
}

export function WishPage() {
  const { currentUser, snapshot, pushToast } = useStudentContext()
  const [courseCode, setCourseCode] = useState(snapshot.courses[0]?.code ?? '')
  const [preferredGroup, setPreferredGroup] = useState('01')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const wishes = snapshot.wishes.filter((wish) => wish.studentId === student.id)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      pushToast({ tone: 'warning', title: 'Thiếu lý do', description: 'Vui lòng nhập lý do để gửi nguyện vọng.' })
      return
    }

    try {
      setIsSubmitting(true)
      await wishService.createWishRequest({
        studentId: student.id,
        semesterId: snapshot.settings.currentSemesterId,
        courseCode,
        preferredGroup,
        reason,
      })
      setReason('')
      pushToast({ tone: 'success', title: 'Đã gửi nguyện vọng', description: 'Nguyện vọng mới đã được lưu qua API backend.' })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không thể gửi nguyện vọng',
        description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Đăng ký nguyện vọng" subtitle="Gửi nhu cầu mở thêm lớp hoặc đổi nhóm học phần, kèm danh sách các yêu cầu đã gửi." />
      <div className="grid gap-6 lg:grid-cols-[0.44fr_0.56fr]">
        <Card title="Gửi nguyện vọng mới" description="Mẫu BM_09 cho nhu cầu mở thêm lớp hoặc đổi nhóm">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input label="Mã môn học" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} list="course-code-list" />
            <Input label="Nhóm / tổ mong muốn" value={preferredGroup} onChange={(event) => setPreferredGroup(event.target.value)} />
            <Textarea label="Lý do" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button type="submit" disabled={isSubmitting}>
              Gửi nguyện vọng
            </Button>
          </form>
          <datalist id="course-code-list">
            {snapshot.courses.map((course) => (
              <option key={course.code} value={course.code} />
            ))}
          </datalist>
        </Card>

        <Card title="Danh sách nguyện vọng đã gửi" description="Theo dõi trạng thái xử lý của từng yêu cầu">
          {wishes.length ? (
            <div className="grid gap-3">
              {wishes.map((wish) => (
                <div key={wish.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {wish.courseCode} - Nhóm {wish.preferredGroup || '--'}
                      </p>
                      <p className="text-sm text-slate-500">{wish.reason}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                        {wish.status}
                      </span>
                      {wish.status === 'PENDING' ? (
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await wishService.cancelWishRequest(wish.id)
                              pushToast({ tone: 'info', title: 'Đã hủy nguyện vọng', description: 'Yêu cầu đã chuyển sang CANCELLED.' })
                            } catch (error) {
                              pushToast({
                                tone: 'error',
                                title: 'Không thể hủy nguyện vọng',
                                description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu.',
                              })
                            }
                          }}
                          type="button"
                        >
                          Hủy
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có nguyện vọng nào" description="Hãy gửi nguyện vọng đầu tiên nếu cần mở thêm lớp hoặc đổi nhóm." />
          )}
        </Card>
      </div>
    </div>
  )
}

export function RegisteredPage() {
  const { currentUser, snapshot } = useStudentContext()
  const [statusFilter, setStatusFilter] = useState('ALL')

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const rows = getStudentSemesterEnrollments(snapshot, student.id).filter((item) =>
    statusFilter === 'ALL' ? true : item.enrollment.status === statusFilter,
  )

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'courseCode', header: 'Mã MH', render: (row) => row.section?.courseCode ?? '--' },
    { key: 'courseName', header: 'Tên môn học', render: (row) => row.course?.name ?? '--' },
    { key: 'group', header: 'Nhóm', render: (row) => row.section?.group ?? '--' },
    { key: 'credits', header: 'Tín chỉ', render: (row) => String(row.course?.credits ?? '--') },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="enrollment" status={row.enrollment.status} /> },
    { key: 'note', header: 'Ghi chú', render: (row) => row.enrollment.timeline.at(-1)?.note ?? '--' },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Danh sách học phần đã đăng ký / kết quả" subtitle="Tổng hợp trạng thái đăng ký hiện tại để đối chiếu nhanh với lịch học, waitlist và các kết quả xử lý." />
      <FilterBar
        actions={
          <ExportButtons
            fileName="student-registered.csv"
            rows={rows.map((row) => ({
              ma_mon: row.section?.courseCode ?? '',
              ten_mon: row.course?.name ?? '',
              nhom: row.section?.group ?? '',
              tin_chi: row.course?.credits ?? '',
              trang_thai: row.enrollment.status,
            }))}
          />
        }
      >
        <Input label="Lọc theo trạng thái" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} list="registered-status-list" />
      </FilterBar>
      <datalist id="registered-status-list">
        <option value="ALL" />
        <option value="REGISTERED">DK_TC</option>
        <option value="WAITLISTED">KHONG_DU_DK</option>
        <option value="CANCELLED">HUY_DK</option>
        <option value="DROPPED">HUY_DK</option>
      </datalist>
      <Table columns={columns} rows={rows} rowKey={(row) => row.enrollment.id} />
    </div>
  )
}


