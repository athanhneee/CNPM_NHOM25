import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import { formatDateTime } from '@/lib/date'
import { ApiError } from '@/lib/api-client'
import { getCurrentSemesterSections, getStudentCurrentCredits, getStudentSemesterEnrollments } from '@/lib/selectors'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Badge } from '@/components/ui/Badge'
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
import { scheduleService } from '@/services/schedule.api'
import { wishService } from '@/services/wish.api'
import type { Course } from '@/types/course'
import type { ScheduleEntry } from '@/types/schedule'
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

      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
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
                  {row.enrollment.isRetake && <Badge className="bg-amber-100 text-amber-800 border-amber-200">Học lại</Badge>}
                  {row.enrollment.isImprovement && <Badge className="bg-purple-100 text-purple-800 border-purple-200">Cải thiện</Badge>}
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

export default WithdrawPage;
