import { useEffect, useState, useMemo } from 'react'
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
import { isCourseAllowedForClass } from '@/lib/classCourseMapping'
import { authApiService } from '@/services/auth.api'
import type { Course } from '@/types/course'
import type { User, AcademicRecords } from '@/types/user'

// ────────────────────────────────────────────────────────────────────
// Filter mode definitions
// ────────────────────────────────────────────────────────────────────

type FilterMode =
  | 'all'                  // Lọc theo môn học (tìm kiếm chung)
  | 'class-open'           // Môn học mở theo lớp sinh viên
  | 'curriculum-plan'      // Môn trong chương trình đào tạo kế hoạch
  | 'curriculum-remaining' // Môn chưa học trong CTĐT kế hoạch
  | 'retake'               // Môn sinh viên cần học lại (đã rớt)
  | 'by-faculty'           // Lọc theo khoa quản lý môn học
  | 'by-class'             // Lọc theo lớp

// ────────────────────────────────────────────────────────────────────
// Hooks & helpers
// ────────────────────────────────────────────────────────────────────

function useStudentContext() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)
  const pushToast = useUiStore((state) => state.pushToast)
  const [academicRecords, setAcademicRecords] = useState<AcademicRecords | null>(null)
  const [studentClasses, setStudentClasses] = useState<string[]>([])

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
      authApiService.getAcademicRecords().catch(() => null),
      authApiService.getStudentClasses().catch(() => [] as string[]),
    ])
      .then(([, , , , records, classes]) => {
        if (!mounted) return
        useDataStore.getState().setApiStatus('ready')
        useDataStore.getState().setLastSyncedAt(new Date().toISOString())
        if (records) setAcademicRecords(records)
        setStudentClasses(classes ?? [])
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
    academicRecords,
    studentClasses,
    actor: currentUser
      ? { actorId: currentUser.id, actorRole: currentUser.roles[0] ?? 'STUDENT' }
      : null,
  }
}

/**
 * Tính học kỳ thứ mấy trong CTĐT của sinh viên (1-indexed).
 *
 * Logic: admissionYear = 20XX (từ mã SV), currentSemesterId = "YYYY-YYYY-T"
 * → yearsStudied = firstYear - admissionYear (0-indexed)
 * → semesterIndex = yearsStudied * 2 + termNumber
 *
 * Ví dụ: SV N23DCCN001 (2023), HK "2025-2026-2" → yearsStudied = 2025-2023 = 2
 * → semesterIndex = 2*2 + 2 = 6 (học kỳ 6 trong CTĐT)
 */
function getStudentSemesterIndex(studentCode: string, currentSemesterId: string): number {
  const twoDigit = studentCode.slice(1, 3)
  const admissionYear = Number(`20${twoDigit}`)
  if (Number.isNaN(admissionYear) || admissionYear < 2000) return 1

  // Parse "2025-2026-2" → firstYear=2025, term=2
  const parts = currentSemesterId.split('-')
  const firstYear = Number(parts[0])
  const term = Number(parts[parts.length - 1])

  if (Number.isNaN(firstYear) || Number.isNaN(term)) return 1

  const yearsStudied = firstYear - admissionYear
  return Math.max(1, yearsStudied * 2 + term)
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

// ────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────

export function RegisterPage() {
  const { currentUser, snapshot, pushToast, actor, academicRecords, studentClasses } = useStudentContext()
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 5
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [checkResult, setCheckResult] = useState<ReturnType<typeof evaluateEnrollmentEligibility> | null>(null)
  const [checkingId, setCheckingId] = useState('')
  const [loadingId, setLoadingId] = useState('')

  const student = currentUser
  const auditActor = actor
  const studentClass = student?.studentClass ?? ''
  const studentProgram = student?.majorName ?? student?.program ?? ''
  const studentSemesterIndex = student ? getStudentSemesterIndex(student.code, snapshot.settings.currentSemesterId) : 0

  // Derived data for curriculum-based filters
  const passedCourseCodes = useMemo(() => {
    const set = new Set<string>()
    if (academicRecords?.completedCourses) {
      for (const c of academicRecords.completedCourses) {
        if (c.passed) set.add(c.courseCode)
      }
    }
    return set
  }, [academicRecords])

  const failedCourseCodes = useMemo(() => {
    const set = new Set<string>()
    if (academicRecords?.completedCourses) {
      for (const c of academicRecords.completedCourses) {
        if (!c.passed) set.add(c.courseCode)
      }
    }
    return set
  }, [academicRecords])

  // Also include currently registered courses as "in-progress" to not show them as "remaining"
  const ongoingCourseCodes = useMemo(() => {
    const set = new Set<string>()
    if (academicRecords?.ongoingCourses) {
      for (const c of academicRecords.ongoingCourses) {
        set.add(c.courseCode)
      }
    }
    return set
  }, [academicRecords])

  // Sub-filter options
  const classOptions = useMemo(() => {
    const set = new Set(studentClasses)
    // Always include current student's class
    if (studentClass) set.add(studentClass)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [studentClasses, studentClass])
  const facultyOptions = Array.from(
    new Set(
      snapshot.courses
        .map((course) => course.faculty ?? course.department)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right, 'vi'))

  // ── Build course options for "Lọc theo môn học" mode ──────────
  const courseOptions = useMemo(() => {
    const allSects = getCurrentSemesterSections(snapshot)
    const courseMap = new Map<string, { code: string; name: string; tag: string; order: number }>()

    for (const row of allSects) {
      const c = row.course
      if (!c || courseMap.has(c.code)) continue

      // Determine category tag and priority
      if (c.suggestedSemester === studentSemesterIndex) {
        courseMap.set(c.code, { code: c.code, name: c.name, tag: 'CTĐT kỳ hiện tại', order: 1 })
      } else if (failedCourseCodes.has(c.code) && !passedCourseCodes.has(c.code)) {
        courseMap.set(c.code, { code: c.code, name: c.name, tag: 'Cần học lại', order: 2 })
      } else if (
        c.suggestedSemester &&
        c.suggestedSemester > studentSemesterIndex &&
        c.suggestedSemester <= studentSemesterIndex + 2 &&
        !passedCourseCodes.has(c.code) &&
        !ongoingCourseCodes.has(c.code)
      ) {
        courseMap.set(c.code, { code: c.code, name: c.name, tag: 'Có thể học trước', order: 3 })
      } else if (
        c.suggestedSemester &&
        c.suggestedSemester <= studentSemesterIndex &&
        !passedCourseCodes.has(c.code) &&
        !ongoingCourseCodes.has(c.code)
      ) {
        courseMap.set(c.code, { code: c.code, name: c.name, tag: 'Còn thiếu trong CTĐT', order: 1 })
      }
    }

    return Array.from(courseMap.values()).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'vi'))
  }, [snapshot, studentSemesterIndex, failedCourseCodes, passedCourseCodes, ongoingCourseCodes])

  // ── Primary filter mode options ──────────────────────────────
  const filterModeOptions: Array<{ label: string; value: FilterMode }> = [
    { label: 'Lọc theo môn học', value: 'all' },
    { label: `Môn học mở theo lớp sinh viên ${studentClass || 'N/A'}`, value: 'class-open' },
    { label: 'Môn trong chương trình đào tạo kế hoạch', value: 'curriculum-plan' },
    { label: 'Môn chưa học trong CTĐT kế hoạch', value: 'curriculum-remaining' },
    { label: 'Môn sinh viên cần học lại (đã rớt)', value: 'retake' },
    { label: 'Lọc theo khoa quản lý môn học', value: 'by-faculty' },
    { label: 'Lọc theo lớp', value: 'by-class' },
  ]

  // ── Filter logic ─────────────────────────────────────────────
  const allSections = getCurrentSemesterSections(snapshot)

  const sectionRows = allSections.filter((item) => {
    const course = item.course

    switch (filterMode) {
      case 'all': {
        // Nếu không có tìm kiếm: hiện các môn gợi ý (CTĐT kỳ hiện tại, cần học lại, hoặc có thể học trước)
        if (!query) {
          if (!course) return false
          const relevantCodes = new Set(courseOptions.map((o) => o.code))
          return relevantCodes.has(course.code)
        }
        
        // Nếu có tìm kiếm: lọc theo mã hoặc tên môn
        const keyword = query.toLowerCase()
        // Nếu input query là định dạng từ datalist (vd: "INT402 - Cấu trúc dữ liệu..."), extract mã môn
        const searchCode = query.split(' - ')[0]?.trim().toLowerCase()
        
        return (
          item.section.courseCode.toLowerCase().includes(searchCode || keyword) ||
          item.section.sectionCode.toLowerCase().includes(keyword) ||
          course?.name.toLowerCase().includes(keyword)
        )
      }

      case 'class-open': {
        // Môn mở cho lớp SV: filter theo majorsSupported match program SV
        if (!course) return false
        const supported = course.majorsSupported ?? []
        if (!supported.length) return true // Áp dụng chung
        
        // Dùng helper để kiểm tra xem môn này có ĐẶC THÙ bị giới hạn cho lớp khác không
        if (!isCourseAllowedForClass(course.name, studentClass || '')) {
          return false
        }
        
        if (studentProgram && supported.includes(studentProgram)) return true
        
        // Fallback: deduce major from class name (e.g. D23CQCN01-N -> CN -> Công nghệ thông tin)
        if (studentClass) {
          const majorMap: Record<string, string> = {
            'CN': 'Công nghệ thông tin',
            'AT': 'An toàn thông tin',
            'VT': 'Viễn thông',
            'DT': 'Điện tử',
            'PT': 'Đa phương tiện',
            'QT': 'Quản trị kinh doanh',
            'KT': 'Kế toán',
            'MR': 'Marketing',
          }
          
          for (const [code, name] of Object.entries(majorMap)) {
            // Môn hỗ trợ ngành này VÀ lớp sinh viên thuộc ngành này
            if (studentClass.includes(code) && supported.includes(name)) {
              return true
            }
          }
        }
        
        return false
      }

      case 'curriculum-plan': {
        // Chỉ hiện môn có suggestedSemester = kỳ hiện tại trong CTĐT
        if (!course) return false
        return course.suggestedSemester === studentSemesterIndex
      }

      case 'curriculum-remaining': {
        // Môn chưa học: suggestedSemester ≤ kỳ hiện tại, chưa passed, chưa đang học
        if (!course) return false
        if (!course.suggestedSemester || course.suggestedSemester > studentSemesterIndex) return false
        if (passedCourseCodes.has(course.code)) return false
        if (ongoingCourseCodes.has(course.code)) return false
        return true
      }

      case 'retake': {
        // Môn đã rớt: courseCode nằm trong danh sách failed VÀ chưa passed lại
        if (!course) return false
        return failedCourseCodes.has(course.code) && !passedCourseCodes.has(course.code)
      }

      case 'by-faculty': {
        // Lọc theo khoa
        return courseMatchesManagingFaculty(course, facultyFilter)
      }

      case 'by-class': {
        // Lọc theo lớp sinh viên
        if (!course) return false
        if (!isCourseAllowedForClass(course.name, classFilter || '')) {
          return false
        }
        const scope = inferRegistrationClassScope(classFilter, snapshot.users)
        return courseMatchesRegistrationClass(course, scope)
      }

      default:
        return true
    }
  })

  // Apply search query as secondary filter for modes that show sub-filter search
  const filteredRows = (filterMode === 'by-faculty' || filterMode === 'by-class') && query
    ? sectionRows.filter((item) => {
        const keyword = query.toLowerCase()
        return (
          item.section.courseCode.toLowerCase().includes(keyword) ||
          item.section.sectionCode.toLowerCase().includes(keyword) ||
          item.course?.name.toLowerCase().includes(keyword)
        )
      })
    : sectionRows

  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  const currentCredits = student ? getStudentCurrentCredits(snapshot, student.id) : 0
  const currentEnrollments = student ? getStudentSemesterEnrollments(snapshot, student.id) : []

  async function handleCheck(sectionId: string) {
    const section = snapshot.sections.find((item) => item.id === sectionId)
    const targetCourse = snapshot.courses.find((item) => item.code === section?.courseCode)
    if (!section || !targetCourse || !student) {
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

  // ── Filter mode description badge ────────────────────────────
  function getFilterDescription(): string {
    switch (filterMode) {
      case 'all': {
        if (query) {
          return `Tìm kiếm: "${query}"`
        }
        return `${courseOptions.length} môn gợi ý (CTĐT, học lại, học trước)`
      }
      case 'class-open':
        return `Lớp ${studentClass} • ${studentProgram || 'Áp dụng chung'}`
      case 'curriculum-plan':
        return `Kỳ ${studentSemesterIndex} trong CTĐT • Các môn đúng tiến độ`
      case 'curriculum-remaining':
        return `Kỳ 1–${studentSemesterIndex} • Các môn còn thiếu chưa hoàn thành`
      case 'retake':
        return `${failedCourseCodes.size} môn cần học lại`
      case 'by-faculty':
        return facultyFilter || 'Chọn khoa để lọc'
      case 'by-class':
        return classFilter || 'Chọn lớp để lọc'
      default:
        return ''
    }
  }

  if (!student || !auditActor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
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
        <Card title="Bảng chọn lớp học phần" description="Chọn chế độ lọc, kiểm tra điều kiện và đăng ký trực tiếp">
          {/* ── Primary filter dropdown ──────────────────────── */}
          <div className="mb-5 grid gap-3 xl:grid-cols-2">
            <Select
              label="Chế độ lọc"
              value={filterMode}
              onChange={(event) => {
                setFilterMode(event.target.value as FilterMode)
                setCurrentPage(1)
                setQuery('')
                setFacultyFilter('')
                setClassFilter('')
              }}
              options={filterModeOptions.map((o) => ({ label: o.label, value: o.value }))}
            />

            {/* ── Conditional sub-filters ──────────────────── */}
            {filterMode === 'all' && (
              <>
                <SearchInput
                  label="Tìm theo mã / tên môn học (Gợi ý)"
                  placeholder="Nhập từ khóa hoặc chọn từ danh sách..."
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setCurrentPage(1) }}
                  list="course-suggestions"
                />
                <datalist id="course-suggestions">
                  {courseOptions.map((c) => (
                    <option key={c.code} value={`${c.code} - ${c.name}`}>
                      {c.tag}
                    </option>
                  ))}
                </datalist>
              </>
            )}

            {filterMode === 'by-faculty' && (
              <Select
                label="Chọn khoa quản lý"
                value={facultyFilter}
                onChange={(event) => { setFacultyFilter(event.target.value); setCurrentPage(1) }}
                options={[
                  { label: 'Tất cả khoa', value: '' },
                  ...facultyOptions.map((f) => ({ label: f, value: f })),
                ]}
              />
            )}

            {filterMode === 'by-class' && (
              <Select
                label="Chọn lớp sinh viên"
                value={classFilter}
                onChange={(event) => { setClassFilter(event.target.value); setCurrentPage(1) }}
                options={[
                  { label: 'Tất cả lớp', value: '' },
                  ...classOptions.map((c) => ({ label: c, value: c })),
                ]}
              />
            )}
          </div>

          {/* ── Filter info badge ──────────────────────────── */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-700">
              {filterModeOptions.find((o) => o.value === filterMode)?.label}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-muted)]">
              {getFilterDescription()}
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-hairline)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-ink)]">
              {filteredRows.length} lớp
            </span>
          </div>

          {filteredRows.length ? (
            <div className="space-y-4">
              {paginatedRows.map((row) => (
                <div
                  key={row.section.id}
                  className="rounded-3xl border border-[var(--color-hairline)] bg-white p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-airbnb)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-ink)]">{row.course?.name ?? row.section.sectionCode}</p>
                      <p className="mt-0.5 text-sm text-[var(--color-muted)]">{row.section.sectionCode} • {row.section.courseCode} • {row.course?.credits ?? '--'} tín chỉ</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        <span className="font-medium text-[var(--color-ink)]">{row.course?.courseType ?? 'Danh mục chung'}</span>
                        <span className="mx-2 text-[var(--color-hairline)]">|</span>
                        Ngành áp dụng: {row.course?.majorsSupported?.length ? row.course.majorsSupported.join(', ') : 'Áp dụng chung'}
                        <span className="mx-2 text-[var(--color-hairline)]">|</span>
                        Khoa: {row.course?.faculty ?? row.course?.department ?? 'Đang cập nhật khoa'}
                      </p>
                      {row.course?.suggestedSemester && (
                        <p className="text-xs text-[var(--color-muted)]">
                          CTĐT kỳ {row.course.suggestedSemester}
                          {failedCourseCodes.has(row.course.code) && !passedCourseCodes.has(row.course.code) && (
                            <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">Cần học lại</span>
                          )}
                        </p>
                      )}
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
                    Hiển thị <span className="font-medium text-[var(--color-ink)]">{startIndex + 1}</span> đến <span className="font-medium text-[var(--color-ink)]">{Math.min(startIndex + PAGE_SIZE, filteredRows.length)}</span> trong tổng số <span className="font-medium text-[var(--color-ink)]">{filteredRows.length}</span> lớp
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
            <EmptyState
              title="Không có lớp học phần phù hợp"
              description={
                filterMode === 'retake'
                  ? 'Không có môn nào cần học lại. Chúc mừng bạn!'
                  : filterMode === 'curriculum-remaining'
                    ? 'Bạn đã hoàn thành tất cả các môn theo CTĐT đến kỳ hiện tại.'
                    : 'Hãy đổi chế độ lọc hoặc từ khóa tìm kiếm để xem danh sách khác.'
              }
            />
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
