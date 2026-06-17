import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { ExportButtons } from '@/components/shared/ExportButtons'
import { FilterBar } from '@/components/shared/FilterBar'
import { InfoList } from '@/components/shared/InfoList'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { reportService } from '@/services/report.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
import { getCurrentSemesterSections, getSectionStudents, getSectionWaitlist } from '@/lib/selectors'
import type { Course, WishRequest } from '@/types/course'
import type { ReportRow, UtilizationStats } from '@/types/settings'
import type { SectionStatus } from '@/types/section'

type CourseTypeValue = NonNullable<Course['courseType']>

type AcademicBlockValue = NonNullable<Course['academicBlock']>

const DEFAULT_COURSE_TYPE: CourseTypeValue = 'Tự chọn'

const DEFAULT_ACADEMIC_BLOCK: AcademicBlockValue = 'electiveCourses'

const DEFAULT_ROOM_OPTIONS = ['A1-101', 'A1-201', 'A2-301', 'B1-201', 'LAB-01']

const MAJOR_CODE_BY_NAME: Record<string, string> = {
  'Công nghệ thông tin': '7480201',
  'An toàn thông tin': '7480202',
}

function normalizeMajors(rawValue: string) {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

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
  REJECTED: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

function WishStatusBadge({ status }: { status: WishRequest['status'] }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${wishStatusClassNames[status]}`}>
      {wishStatusLabels[status]}
    </span>
  )
}

function formatWishDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function WishReviewPage() {
  const { currentUser, snapshot, pushToast } = useAcademicContext()
  const [statusFilter, setStatusFilter] = useState<WishRequest['status'] | 'ALL'>('ALL')
  const [updatingWishId, setUpdatingWishId] = useState('')
  const [decision, setDecision] = useState<{ wishId: string; status: 'APPROVED' | 'REJECTED' } | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const currentSemesterId = snapshot.settings.currentSemesterId

  useEffect(() => {
    if (!currentUser) {
      return
    }

    void wishService
      .listWishes({ semesterId: currentSemesterId })
      .catch(() => undefined)
  }, [currentSemesterId, currentUser])

  const rows = useMemo(
    () =>
      snapshot.wishes
        .filter((wish) => wish.semesterId === currentSemesterId)
        .filter((wish) => statusFilter === 'ALL' || wish.status === statusFilter)
        .map((wish) => ({
          wish,
          student: snapshot.users.find((user) => user.id === wish.studentId),
          course: snapshot.courses.find((course) => course.code === wish.courseCode),
        }))
        .sort((left, right) => right.wish.createdAt.localeCompare(left.wish.createdAt)),
    [currentSemesterId, snapshot.courses, snapshot.users, snapshot.wishes, statusFilter],
  )

  const pendingCount = snapshot.wishes.filter(
    (wish) => wish.semesterId === currentSemesterId && wish.status === 'PENDING',
  ).length
  const approvedCount = snapshot.wishes.filter(
    (wish) => wish.semesterId === currentSemesterId && wish.status === 'APPROVED',
  ).length
  const rejectedCount = snapshot.wishes.filter(
    (wish) => wish.semesterId === currentSemesterId && wish.status === 'REJECTED',
  ).length

  const updateWishStatus = async (wishId: string, status: WishRequest['status'], nextReviewNote?: string) => {
    if (status === 'REJECTED' && !nextReviewNote?.trim()) {
      pushToast({
        tone: 'warning',
        title: 'Cần nhập lý do từ chối',
        description: 'Lý do sẽ được ghi vào audit metadata để đối chiếu khi báo cáo.',
      })
      return false
    }

    setUpdatingWishId(wishId)
    try {
      await wishService.updateWishStatus(wishId, status, nextReviewNote)
      pushToast({
        tone: status === 'REJECTED' ? 'warning' : 'success',
        title: 'Đã cập nhật nguyện vọng',
        description: `Trạng thái mới: ${wishStatusLabels[status]}.`,
      })
      return true
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không thể cập nhật nguyện vọng',
        description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu này.',
      })
      return false
    } finally {
      setUpdatingWishId('')
    }
  }

  const columns: TableColumn<(typeof rows)[number]>[] = [
    {
      key: 'student',
      header: 'Sinh viên',
      render: (row) => (
        <div className="grid gap-1">
          <p className="font-semibold text-slate-900">{row.student?.fullName ?? row.wish.studentId}</p>
          <p className="text-sm text-slate-500">{row.student?.code ?? row.wish.studentId}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Học phần',
      render: (row) => (
        <div className="grid gap-1">
          <p className="font-semibold text-slate-900">{row.wish.courseCode}</p>
          <p className="text-sm text-slate-500">{row.course?.name ?? 'Chưa có tên học phần'}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Lý do',
      render: (row) => (
        <div className="max-w-xl">
          <p className="text-sm leading-6 text-slate-700">{row.wish.reason}</p>
          <p className="mt-1 text-sm text-slate-500">
            Nhóm mong muốn: {row.wish.preferredGroup || '--'} - {formatWishDate(row.wish.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <WishStatusBadge status={row.wish.status} />,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row.wish.status === 'PENDING' ? (
            <Button
              className="px-3 py-2"
              loading={updatingWishId === row.wish.id}
              onClick={() => void updateWishStatus(row.wish.id, 'REVIEWED')}
              type="button"
              variant="secondary"
            >
              Đã xem
            </Button>
          ) : null}
          {row.wish.status !== 'APPROVED' && row.wish.status !== 'CANCELLED' ? (
            <Button
              className="px-3 py-2"
              loading={updatingWishId === row.wish.id}
              onClick={() => {
                setDecision({ wishId: row.wish.id, status: 'APPROVED' })
                setReviewNote('Đã duyệt nguyện vọng, phòng đào tạo sẽ cân nhắc mở lớp hoặc đổi nhóm.')
              }}
              type="button"
            >
              Duyệt
            </Button>
          ) : null}
          {row.wish.status !== 'REJECTED' && row.wish.status !== 'CANCELLED' ? (
            <Button
              className="px-3 py-2"
              loading={updatingWishId === row.wish.id}
              onClick={() => {
                setDecision({ wishId: row.wish.id, status: 'REJECTED' })
                setReviewNote('')
              }}
              type="button"
              variant="danger"
            >
              Từ chối
            </Button>
          ) : null}
        </div>
      ),
    },
  ]

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy tài khoản" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Phòng đào tạo - Duyệt nguyện vọng"
        subtitle="Theo dõi nhu cầu mở lớp, đổi nhóm và cập nhật trạng thái xử lý trực tiếp từ backend."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tổng nguyện vọng" value={String(snapshot.wishes.filter((wish) => wish.semesterId === currentSemesterId).length)} hint="Học kỳ hiện tại" />
        <StatCard label="Chờ xử lý" value={String(pendingCount)} hint="Cần phòng đào tạo xem" />
        <StatCard label="Đã duyệt" value={String(approvedCount)} hint="Có thể mở lớp/đổi nhóm" />
        <StatCard label="Từ chối" value={String(rejectedCount)} hint="Cần ghi rõ lý do khi báo cáo" />
      </div>
      <FilterBar>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-700">Lọc trạng thái</span>
          <select
            className="brand-ring rounded-2xl border border-slate-200 bg-white/96 px-5 py-4 text-sm text-slate-900"
            onChange={(event) => setStatusFilter(event.target.value as WishRequest['status'] | 'ALL')}
            value={statusFilter}
          >
            <option value="ALL">Tất cả</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="REVIEWED">Đã xem</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </label>
      </FilterBar>
      {rows.length ? (
        <Table columns={columns} rows={rows} rowKey={(row) => row.wish.id} />
      ) : (
        <EmptyState title="Chưa có nguyện vọng phù hợp" description="Đổi bộ lọc khác hoặc để sinh viên gửi yêu cầu mới." />
      )}
      <ConfirmDialog
        danger={decision?.status === 'REJECTED'}
        loading={Boolean(decision && updatingWishId === decision.wishId)}
        open={decision !== null}
        title={decision?.status === 'REJECTED' ? 'Từ chối nguyện vọng' : 'Duyệt nguyện vọng'}
        description="Phản hồi này sẽ được gửi lên backend và ghi vào audit metadata để phục vụ đối chiếu sau demo."
        confirmLabel={decision?.status === 'REJECTED' ? 'Từ chối' : 'Duyệt'}
        onClose={() => {
          if (!updatingWishId) {
            setDecision(null)
            setReviewNote('')
          }
        }}
        onConfirm={async () => {
          if (!decision) {
            return
          }
          const ok = await updateWishStatus(decision.wishId, decision.status, reviewNote)
          if (ok) {
            setDecision(null)
            setReviewNote('')
          }
        }}
      >
        <Textarea
          label="Lý do phản hồi"
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          hint={decision?.status === 'REJECTED' ? 'Bắt buộc khi từ chối.' : 'Nên ghi ngắn gọn để dễ rà audit log.'}
        />
      </ConfirmDialog>
    </div>
  )
}

export default WishReviewPage;
