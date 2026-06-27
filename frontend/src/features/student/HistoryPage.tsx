import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/date'
import { getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Dialog } from '@/components/ui/Dialog'
import { Table, type TableColumn } from '@/components/ui/Table'
import { FilterBar } from '@/components/shared/FilterBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TimelineList } from '@/components/shared/TimelineList'
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
    { key: 'status', header: 'Trạng thái', render: (row) => (
      <div className="flex flex-wrap items-center gap-2">
        {row.enrollment.isRetake && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Học lại</Badge>}
        {row.enrollment.isImprovement && <Badge className="bg-purple-100 text-purple-800 border-purple-200">Cải thiện</Badge>}
        <StatusBadge kind="enrollment" status={row.enrollment.status} />
      </div>
    ) },
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
        <option value="REGISTERED">Đăng ký thành công</option>
        <option value="WAITLISTED">KHONG_DU_DK</option>
        <option value="CANCELLED">HUY_DK</option>
        <option value="DROPPED">HUY_DK</option>
        <option value="REJECTED">KHONG_DU_DK</option>
      </datalist>
      <Table columns={columns} rows={rows} rowKey={(row) => row.enrollment.id} pageSize={10} />
      <Dialog open={Boolean(selected)} title="Timeline đăng ký" description="Chỉ để tra cứu, không cho phép chỉnh sửa." onClose={() => setSelectedId('')}>
        {selected ? <TimelineList items={selected.enrollment.timeline} /> : null}
      </Dialog>
    </div>
  )
}

export default HistoryPage;
