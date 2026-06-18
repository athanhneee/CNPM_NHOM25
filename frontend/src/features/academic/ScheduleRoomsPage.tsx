import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { sectionService } from '@/services/section.api'
import { getCurrentSemesterSections } from '@/lib/selectors'
import type { Course, WishRequest } from '@/types/course'

type CourseTypeValue = NonNullable<Course['courseType']>

type AcademicBlockValue = NonNullable<Course['academicBlock']>

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_COURSE_TYPE: CourseTypeValue = 'Tự chọn'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DEFAULT_ACADEMIC_BLOCK: AcademicBlockValue = 'electiveCourses'

const DEFAULT_ROOM_OPTIONS = ['A1-101', 'A1-201', 'A2-301', 'B1-201', 'LAB-01']

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MAJOR_CODE_BY_NAME: Record<string, string> = {
  'Công nghệ thông tin': '7480201',
  'An toàn thông tin': '7480202',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeMajors(rawValue: string) {
  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  REJECTED: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WishStatusBadge({ status }: { status: WishRequest['status'] }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${wishStatusClassNames[status]}`}>
      {wishStatusLabels[status]}
    </span>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatWishDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ScheduleRoomsPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [room, setRoom] = useState('A2-301')
  const [weekday, setWeekday] = useState('2')
  const [startPeriod, setStartPeriod] = useState('1')
  const [periodCount, setPeriodCount] = useState('3')
  const roomOptions = useMemo(
    () => buildRoomOptions(snapshot.sections.map((section) => section.room)),
    [snapshot.sections],
  )

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const selected = sections.find((item) => item.section.id === selectedSectionId) ?? sections[0]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Quản lý lịch học và phòng học" subtitle="Cập nhật room schedule và kiểm tra xung đột phòng trước khi lưu." />
      <div className="grid gap-6 lg:grid-cols-[0.52fr_0.48fr]">
        <Card title="Danh sách section" description="Chọn section để đổi phòng hoặc đổi lịch">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-3xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => {
                  setSelectedSectionId(row.section.id)
                  setRoom(row.section.room)
                  setWeekday(String(row.section.weekday))
                  setStartPeriod(String(row.section.startPeriod))
                  setPeriodCount(String(row.section.periodCount))
                }}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.section.room} • Thứ {row.section.weekday} • Tiết {row.section.startPeriod}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <Card title="Cập nhật phòng và lịch" description="Thay đổi sẽ được kiểm tra xung đột phòng học trong học kỳ hiện tại">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Phòng học" value={room} onChange={(event) => setRoom(event.target.value)} list="schedule-room-options" />
              <Input label="Thứ" value={weekday} onChange={(event) => setWeekday(event.target.value)} />
              <Input label="Tiết bắt đầu" value={startPeriod} onChange={(event) => setStartPeriod(event.target.value)} />
              <Input label="Số tiết" value={periodCount} onChange={(event) => setPeriodCount(event.target.value)} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                onClick={async () => {
                  try {
                    await sectionService.updateRoomSchedule(selected.section.id, {
                      room,
                      weekday: Number(weekday) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
                      startPeriod: Number(startPeriod),
                      periodCount: Number(periodCount),
                    }, actor)
                    pushToast({ tone: 'success', title: 'Đã cập nhật lịch học', description: 'Phòng học và khung giờ đã được lưu.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể cập nhật lịch học', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Lưu thay đổi
              </Button>
            </div>
            <datalist id="schedule-room-options">
              {roomOptions.map((roomOption) => (
                <option key={roomOption} value={roomOption} />
              ))}
            </datalist>
          </Card>
        ) : (
          <EmptyState title="Chưa có section nào" description="Không có dữ liệu để cập nhật room schedule." />
        )}
      </div>
    </div>
  )
}

export default ScheduleRoomsPage;
