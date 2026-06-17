import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { ApiError } from '@/lib/api-client'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { WeekCalendarGrid } from '@/components/calendar/WeekCalendarGrid'
import { SemesterScheduleTable } from '@/components/calendar/SemesterScheduleTable'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCapacityBar } from '@/components/shared/SectionCapacityBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getLecturerSections, getSectionStudents } from '@/lib/selectors'
import { courseService } from '@/services/course.api'
import { scheduleService } from '@/services/schedule.api'
import { sectionService, type SectionStudentRow } from '@/services/section.api'
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

export function SectionStudentsPage() {
  const { sectionId } = useParams()
  const { currentUser, snapshot } = useLecturerContext()
  const [query, setQuery] = useState('')
  const [apiResult, setApiResult] = useState<{ sectionId: string; rows: SectionStudentRow[] } | null>(null)

  useEffect(() => {
    if (!sectionId || !currentUser?.roles.includes('LECTURER')) {
      return
    }

    void sectionService
      .getSectionStudents(sectionId)
      .then((rows) => setApiResult({ sectionId, rows }))
      .catch(() => setApiResult({ sectionId, rows: [] }))
  }, [currentUser?.id, currentUser?.roles, sectionId])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy giảng viên" description="Vui lòng đăng nhập lại." />
  }

  const ownedSection = snapshot.sections.find((section) => section.id === sectionId && section.lecturerId === currentUser.id)
  if (!ownedSection) {
    return <ErrorState title="Không thể truy cập lớp học phần này" description="Giảng viên chỉ được xem danh sách sinh viên của các lớp do mình phụ trách." />
  }

  const course = snapshot.courses.find((item) => item.code === ownedSection.courseCode)
  const sourceRows = apiResult?.sectionId === ownedSection.id ? apiResult.rows : getSectionStudents(snapshot, ownedSection.id)
  const rows = sourceRows.filter((item) =>
    !query ||
    item.student?.fullName.toLowerCase().includes(query.toLowerCase()) ||
    (item.student?.code ?? '').toLowerCase().includes(query.toLowerCase()),
  )

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'code', header: 'MSSV', render: (row) => row.student?.code ?? '--' },
    { key: 'fullName', header: 'Họ và tên', render: (row) => row.student?.fullName ?? '--' },
    { key: 'program', header: 'Lớp', render: (row) => row.student?.studentClass ?? row.student?.program ?? '--' },
    { key: 'sectionCode', header: 'Mã lớp HP', render: () => ownedSection.sectionCode },
    { key: 'courseCode', header: 'Mã MH', render: () => ownedSection.courseCode },
    { key: 'courseName', header: 'Tên môn học', render: () => course?.name ?? '--' },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="enrollment" status={row.enrollment.status} /> },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Giảng viên - Danh sách sinh viên trong lớp" subtitle="Chế độ chỉ xem cho lớp được phân công, hỗ trợ tìm theo MSSV và tên sinh viên." />
      <Card title={`${ownedSection.sectionCode} - ${course?.name ?? ownedSection.courseCode}`} description="Danh sách sinh viên và trạng thái đăng ký">
        <div className="mb-4">
          <SearchInput label="Tìm theo MSSV / họ tên" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <Table columns={columns} rows={rows} rowKey={(row) => row.enrollment.id} />
      </Card>
    </div>
  )
}

export default SectionStudentsPage;
