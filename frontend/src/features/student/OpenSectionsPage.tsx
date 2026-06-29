import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getCurrentSemesterSections } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { FilterBar } from '@/components/shared/FilterBar'
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
import { isCourseAllowedForClass } from '@/lib/classCourseMapping'

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [submittingId, setSubmittingId] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const rows = getCurrentSemesterSections(snapshot).filter((item) => {
    // Ẩn section của course đã bị xóa mềm (INACTIVE)
    if (item.course && item.course.status === 'INACTIVE') return false

    // 1. Strict validation: Must belong to student's major and class
    const scope = inferRegistrationClassScope(student.studentClass || '', snapshot.users)
    if (!courseMatchesRegistrationClass(item.course, scope)) {
      return false
    }
    if (!isCourseAllowedForClass(item.course?.name || '', student.studentClass || '')) {
      return false
    }

    const keyword = query.toLowerCase()
    const matchesQuery =
      !query ||
      item.section.sectionCode.toLowerCase().includes(keyword) ||
      item.section.courseCode.toLowerCase().includes(keyword) ||
      item.course?.name.toLowerCase().includes(keyword)
    const matchesStatus = statusFilter === 'ALL' || item.derivedStatus === statusFilter
    return matchesQuery && matchesStatus
  })

  const totalPages = Math.ceil(rows.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedRows = rows.slice(startIndex, startIndex + PAGE_SIZE)

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
        <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
        <SearchInput label="Tìm kiếm môn học / lớp HP" placeholder="INT2102, an toàn mạng..." value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} />
        <Select
          label="Trạng thái"
          value={statusFilter}
          onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1); }}
          options={[
            { label: 'Tất cả trạng thái', value: 'ALL' },
            { label: 'Đang mở đăng ký (OPEN)', value: 'OPEN' },
            { label: 'Đã đầy (FULL)', value: 'FULL' },
            { label: 'Đã đóng (CLOSED)', value: 'CLOSED' },
          ]}
        />
      </FilterBar>

      {rows.length ? (
        <div className="space-y-6">
          <Table columns={columns} rows={paginatedRows} rowKey={(row) => row.section.id} />
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-hairline)] bg-[var(--color-surface)] px-6 py-4 shadow-sm">
              <p className="text-sm text-[var(--color-muted)]">
                Hiển thị <span className="font-medium text-[var(--color-ink)]">{startIndex + 1}</span> đến <span className="font-medium text-[var(--color-ink)]">{Math.min(startIndex + PAGE_SIZE, rows.length)}</span> trong tổng số <span className="font-medium text-[var(--color-ink)]">{rows.length}</span> lớp học phần
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
        <EmptyState title="Không có lớp phù hợp" description="Hãy đổi bộ lọc hoặc tìm kiếm bằng mã môn học, tên môn học." />
      )}
    </div>
  )
}

export default OpenSectionsPage;
