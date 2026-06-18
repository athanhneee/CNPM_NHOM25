import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/date'
import { getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Textarea } from '@/components/ui/Textarea'
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

      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
        <StatCard label="Có thể hủy" value={String(rows.length)} hint="DK_TC hoặc bản ghi chờ nội bộ" />
        <StatCard label="Hạn điều chỉnh" value={snapshot.settings.adjustmentEnd.slice(0, 10)} hint="Hạn cuối hiện tại" />
        <StatCard label="Tín chỉ đang ảnh hưởng" value={String(rows.reduce((sum, item) => sum + (item.course?.credits ?? 0), 0))} hint="Tổng tín chỉ của danh sách hủy" />
      </div>

      {rows.length ? (
        <Card title="Danh sách đăng ký hiện tại" description="Chọn học phần để hủy và ghi lại lý do nếu cần">
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.enrollment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-hairline)] bg-white px-5 py-4">
                <div>
                  <p className="font-semibold text-slate-900">{row.course?.name ?? row.section?.sectionCode}</p>
                  <p className="text-sm text-slate-500">
                    {row.section?.sectionCode} • {row.section?.courseCode} • Đăng ký lúc {formatDateTime(row.enrollment.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {row.enrollment.isRetake && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Học lại</Badge>}
                  {row.enrollment.isImprovement && <Badge className="bg-purple-100 text-purple-800 border-purple-200">Cải thiện</Badge>}
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

export default CancelRegistrationPage;
