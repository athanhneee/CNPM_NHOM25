import { useEffect, useState } from 'react'
import { ApiError } from '@/lib/api-client'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { WeekCalendarGrid } from '@/components/calendar/WeekCalendarGrid'
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

export function WeekSchedulePage() {
  const { currentUser, snapshot } = useStudentContext()
  const studentId = currentUser?.id
  const semesterId = snapshot.settings.currentSemesterId
  const scheduleKey = studentId ? `${studentId}:${semesterId}:week` : ''
  const [apiSchedule, setApiSchedule] = useState<{ key: string; entries: ScheduleEntry[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiEntries = apiSchedule?.key === scheduleKey ? apiSchedule.entries : null

  useEffect(() => {
    if (!studentId) {
      return
    }

    let active = true
    void scheduleService
      .getStudentWeekSchedule(studentId, semesterId)
      .then((entries) => {
        if (active) {
          setApiSchedule({ key: scheduleKey, entries })
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof ApiError && err.status === 403
              ? 'Bạn không có quyền xem dữ liệu này.'
              : err instanceof Error ? err.message : 'Không thể tải lịch học từ hệ thống.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [studentId, semesterId, scheduleKey])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  if (loading) {
    return <EmptyState title="Đang tải lịch học..." description="Vui lòng chờ trong giây lát." />
  }

  if (error) {
    return <EmptyState title="Không thể tải lịch học" description={error} />
  }

  const entries = apiEntries ?? []
  const morning = entries.filter((entry) => entry.startPeriod <= 4).length
  const afternoon = entries.filter((entry) => entry.startPeriod >= 5 && entry.startPeriod <= 8).length
  const evening = entries.filter((entry) => entry.startPeriod > 8).length

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Thời khóa biểu dạng tuần"
        subtitle="Hiển thị lịch theo thứ, tiết và dải tuần học trong học kỳ hiện tại; màn này chưa lọc theo một tuần lịch cụ thể."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tổng buổi" value={String(entries.length)} hint="Các buổi học theo khung tuần của học kỳ" />
        <StatCard label="Buổi sáng" value={String(morning)} hint="Tiết 1-4" />
        <StatCard label="Buổi chiều" value={String(afternoon)} hint="Tiết 5-8" />
        <StatCard label="Buổi tối" value={String(evening)} hint="Tiết 9-10" />
      </div>
      <WeekCalendarGrid entries={entries} />
    </div>
  )
}

export default WeekSchedulePage;
