import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import { getCurrentSemesterSections, getStudentCurrentCredits, getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { CreditMeter } from '@/components/shared/CreditMeter'
import { RuleCheckPanel } from '@/components/shared/RuleCheckPanel'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCapacityBar } from '@/components/shared/SectionCapacityBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { enrollmentService } from '@/services/enrollment.api'
import { courseService } from '@/services/course.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
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

    let mounted = true
    useDataStore.getState().setApiStatus('loading')

    Promise.all([
      courseService.listCourses(),
      sectionService.listSections(),
      enrollmentService.listHistory(currentUser.id),
      wishService.listWishes({ studentId: currentUser.id }),
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

export function RegisterPage() {
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState(currentUser?.studentClass ?? '')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 5
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

  const totalPages = Math.ceil(sectionRows.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedRows = sectionRows.slice(startIndex, startIndex + PAGE_SIZE)

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
    <div className="grid gap-10">
      <PageTitleBlock
        title="Sinh viên - Đăng ký học phần"
        subtitle="Kiểm tra điều kiện theo từng quy tắc học vụ, theo dõi credit meter và gửi đăng ký theo section."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CreditMeter current={currentCredits} min={snapshot.settings.minCredits} max={snapshot.settings.semesterType === 'SUMMER' ? snapshot.settings.maxCreditsSummer : snapshot.settings.maxCreditsMain} />
        <StatCard label="Lớp đang học" value={String(currentEnrollments.filter((item) => item.enrollment.status === 'REGISTERED').length)} hint="Số lớp đã đăng ký thành công" />
        <StatCard label="Đang ở danh sách chờ" value={String(currentEnrollments.filter((item) => item.enrollment.status === 'WAITLISTED').length)} hint="Số lớp chờ xếp chỗ do hết slot" />
        <StatCard label="Cảnh báo" value={checkResult?.checks.filter((item) => !item.passed).length ? String(checkResult.checks.filter((item) => !item.passed).length) : '0'} hint="Các điều kiện học vụ chưa đạt" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.62fr_0.38fr]">
        <Card title="Bảng chọn lớp học phần" description="Sử dụng tìm kiếm, lọc theo lớp sinh viên, khoa quản lý, kiểm tra điều kiện và đăng ký trực tiếp">
          <div className="mb-5 grid gap-3 xl:grid-cols-3">
            <SearchInput label="Tìm theo mã / tên môn học" placeholder="Nhập từ khóa..." value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} />
            <Input
              label="Lớp sinh viên"
              value={classFilter}
              onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1); }}
              list="student-class-filter-list"
              placeholder={student.studentClass ?? 'D23CQCN01-N'}
            />
            <Select
              label="Khoa quản lý"
              value={facultyFilter}
              onChange={(event) => { setFacultyFilter(event.target.value); setCurrentPage(1); }}
              options={[{ label: 'Tất cả khoa', value: '' }, ...facultyOptions.map(f => ({ label: f, value: f }))]}
            />
          </div>
          <datalist id="student-class-filter-list">
            {classOptions.map((classCode) => (
              <option key={classCode} value={classCode} />
            ))}
          </datalist>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]">
              Lớp áp dụng: {classFilter.trim() ? classFilter : 'Tất cả lớp'}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]">
              Chuyên ngành: {classFilter.trim() ? classScope.program ?? 'Áp dụng chung' : 'Tất cả'}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-muted)]">
              Khoa quản lý: {facultyFilter.trim() ? facultyFilter : 'Tất cả khoa'}
            </span>
          </div>
          {sectionRows.length ? (
            <div className="space-y-4">
              {paginatedRows.map((row) => (
                <div
                  key={row.section.id}
                  className="rounded-2xl border border-[var(--color-hairline)] bg-white p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-airbnb)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-ink)]">{row.course?.name ?? row.section.sectionCode}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-muted)]">{row.section.sectionCode} • {row.section.courseCode} • {row.course?.credits ?? '--'} tín chỉ</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {row.course?.courseType ?? 'Danh mục chung'} • {row.course?.majorsSupported?.join(', ') ?? 'Áp dụng chung'} • {row.course?.faculty ?? row.course?.department ?? 'Đang cập nhật khoa'}
                      </p>
                    </div>
                    <StatusBadge kind="section" status={row.derivedStatus} />
                  </div>
                  <div className="mt-3">
                    <SectionCapacityBar capacity={row.section.capacity} registeredCount={row.section.registeredCount} waitlistCount={row.section.waitlistCount} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
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

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-6 py-4 shadow-sm">
                  <p className="text-sm text-[var(--color-muted)]">
                    Hiển thị <span className="font-medium text-[var(--color-ink)]">{startIndex + 1}</span> đến <span className="font-medium text-[var(--color-ink)]">{Math.min(startIndex + PAGE_SIZE, sectionRows.length)}</span> trong tổng số <span className="font-medium text-[var(--color-ink)]">{sectionRows.length}</span> lớp
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
          ) : (
            <EmptyState title="Không có lớp học phần phù hợp" description="Hãy đổi lớp sinh viên, khoa quản lý hoặc từ khóa tìm kiếm để xem danh sách khác." />
          )}
        </Card>

        {checkResult && selectedSectionId ? (
          <RuleCheckPanel
            title={`Kết quả kiểm tra điều kiện lớp: ${snapshot.sections.find((item) => item.id === selectedSectionId)?.sectionCode ?? 'Đang tải'}`}
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

export default RegisterPage;
