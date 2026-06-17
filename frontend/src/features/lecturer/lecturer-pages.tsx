import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
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
import { getLecturerScheduleEntries, getLecturerSections, getSectionStudents } from '@/lib/selectors'
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
      sectionService.listSections({ lecturerId: currentUser.id }),
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

export function AssignedSectionsPage() {
  const { currentUser, snapshot } = useLecturerContext()
  const [query, setQuery] = useState('')

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy giảng viên" description="Vui lòng đăng nhập lại." />
  }

  const rows = getLecturerSections(snapshot, currentUser.id).filter((item) =>
    !query ||
    item.section.sectionCode.toLowerCase().includes(query.toLowerCase()) ||
    item.course?.name.toLowerCase().includes(query.toLowerCase()),
  )

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'sectionCode', header: 'Mã lớp HP', render: (row) => row.section.sectionCode },
    { key: 'courseCode', header: 'Mã MH', render: (row) => row.section.courseCode },
    { key: 'courseName', header: 'Tên môn học', render: (row) => row.course?.name ?? '--' },
    { key: 'group', header: 'Nhóm', render: (row) => row.section.group },
    { key: 'capacity', header: 'Sĩ số', render: (row) => <SectionCapacityBar capacity={row.section.capacity} registeredCount={row.section.registeredCount} waitlistCount={row.section.waitlistCount} /> },
    { key: 'room', header: 'Phòng', render: (row) => row.section.room },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="section" status={row.derivedStatus} /> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <Link to={`/lecturer/sections/${row.section.id}/students`}>
          <Button type="button" variant="secondary">
            Xem sinh viên
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Giảng viên - Danh sách lớp được phân công" subtitle="Chỉ hiển thị các lớp học phần do giảng viên hiện tại phụ trách trong học kỳ đang xem." />
      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Tổng số lớp" value={String(rows.length)} hint="Học kỳ hiện tại" />
        <StatCard label="Tổng sĩ số" value={String(rows.reduce((sum, row) => sum + row.section.registeredCount, 0))} hint="Sinh viên đăng ký hợp lệ" />
        <StatCard label="Tổng giờ giảng" value={String(rows.reduce((sum, row) => sum + row.section.periodCount, 0))} hint="Tính theo số tiết" />
      </div>
      <FilterBar>
        <SearchInput label="Tìm theo mã lớp / tên môn" value={query} onChange={(event) => setQuery(event.target.value)} />
      </FilterBar>
      <Table columns={columns} rows={rows} rowKey={(row) => row.section.id} />
    </div>
  )
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

export function WeekTeachingPage() {
  const { currentUser, snapshot } = useLecturerContext()
  const lecturerId = currentUser?.id
  const semesterId = snapshot.settings.currentSemesterId
  const scheduleKey = lecturerId ? `${lecturerId}:${semesterId}:week` : ''
  const [apiSchedule, setApiSchedule] = useState<{ key: string; entries: ScheduleEntry[] } | null>(null)
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
        }
      })
      .catch(() => {
        if (active) {
          setApiSchedule(null)
        }
      })

    return () => {
      active = false
    }
  }, [lecturerId, semesterId, scheduleKey])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy giảng viên" description="Vui lòng đăng nhập lại." />
  }

  const entries = apiEntries ?? getLecturerScheduleEntries(snapshot, currentUser.id)
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

export function SemesterTeachingPage() {
  const { currentUser, snapshot } = useLecturerContext()
  const [query, setQuery] = useState('')
  const lecturerId = currentUser?.id
  const semesterId = snapshot.settings.currentSemesterId
  const scheduleKey = lecturerId ? `${lecturerId}:${semesterId}:semester` : ''
  const [apiSchedule, setApiSchedule] = useState<{ key: string; entries: ScheduleEntry[] } | null>(null)
  const apiEntries = apiSchedule?.key === scheduleKey ? apiSchedule.entries : null

  useEffect(() => {
    if (!lecturerId) {
      return
    }

    let active = true
    void scheduleService
      .getLecturerSemesterSchedule(lecturerId, semesterId)
      .then((entries) => {
        if (active) {
          setApiSchedule({ key: scheduleKey, entries })
        }
      })
      .catch(() => {
        if (active) {
          setApiSchedule(null)
        }
      })

    return () => {
      active = false
    }
  }, [lecturerId, semesterId, scheduleKey])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy giảng viên" description="Vui lòng đăng nhập lại." />
  }

  const sourceEntries = apiEntries ?? getLecturerScheduleEntries(snapshot, currentUser.id)
  const entries = sourceEntries.filter((entry) =>
    !query || entry.courseCode.toLowerCase().includes(query.toLowerCase()) || entry.title.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Giảng viên - TKB giảng dạy dạng học kỳ" subtitle="Bảng tổng hợp các lớp giảng dạy trong học kỳ, hỗ trợ tìm nhanh theo mã hoặc tên học phần." />
      <FilterBar>
        <Input label="Tìm theo mã / tên môn học" value={query} onChange={(event) => setQuery(event.target.value)} />
      </FilterBar>
      <Card title="Bảng lịch giảng dạy" description="Tổng hợp theo môn học, phòng học và tiết giảng dạy">
        <SemesterScheduleTable entries={entries} />
      </Card>
    </div>
  )
}

