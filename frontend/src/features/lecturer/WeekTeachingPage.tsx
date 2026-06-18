import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { ApiError } from '@/lib/api-client'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { WeekCalendarGrid } from '@/components/calendar/WeekCalendarGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { courseService } from '@/services/course.api'
import { scheduleService } from '@/services/schedule.api'
import { sectionService } from '@/services/section.api'
import type { ScheduleEntry } from '@/types/schedule'

function useLecturerContext() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const snapshot = useDataStore((state) => state)

  useEffect(() => {
    if (!currentUser?.roles.includes('LECTURER')) {
      return
    }

    let mounted = true
    useDataStore.getState().setApiStatus('loading')

    Promise.all([
      courseService.listCourses(),
      sectionService.listMyTeachingSections(),
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

  return { currentUser, snapshot }
}

export function WeekTeachingPage() {
  const { currentUser, snapshot } = useLecturerContext()
  const lecturerId = currentUser?.id
  const semesterId = snapshot.settings.currentSemesterId
  const scheduleKey = lecturerId ? `${lecturerId}:${semesterId}:week` : ''
  const [apiSchedule, setApiSchedule] = useState<{ key: string; entries: ScheduleEntry[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiEntries = apiSchedule?.key === scheduleKey ? apiSchedule.entries : null

  useEffect(() => {
    if (!lecturerId) {
      return
    }

    let active = true
    void scheduleService
      .getLecturerWeekSchedule(lecturerId, semesterId)
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
              : err instanceof Error ? err.message : 'Không thể tải lịch giảng dạy từ hệ thống.',
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [lecturerId, semesterId, scheduleKey])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy giảng viên" description="Vui lòng đăng nhập lại." />
  }

  if (loading) {
    return <EmptyState title="Đang tải lịch giảng dạy..." description="Vui lòng chờ trong giây lát." />
  }

  if (error) {
    return <EmptyState title="Không thể tải lịch giảng dạy" description={error} />
  }

  const entries = apiEntries ?? []
  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Giảng viên - TKB giảng dạy dạng tuần"
        subtitle="Hiển thị lịch dạy theo thứ, tiết và dải tuần học trong học kỳ hiện tại; màn này chưa lọc theo một tuần lịch cụ thể."
      />
      <WeekCalendarGrid entries={entries} />
    </div>
  )
}

export default WeekTeachingPage;
