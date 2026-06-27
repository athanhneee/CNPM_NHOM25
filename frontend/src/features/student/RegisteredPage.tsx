import { useEffect, useState } from 'react'
import { getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { FilterBar } from '@/components/shared/FilterBar'
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <option value="REGISTERED">Đăng ký thành công</option>
        <option value="WAITLISTED">KHONG_DU_DK</option>
        <option value="CANCELLED">HUY_DK</option>
        <option value="DROPPED">HUY_DK</option>
      </datalist>
      <Table columns={columns} rows={rows} rowKey={(row) => row.enrollment.id} />
    </div>
  )
}

export default RegisteredPage;
