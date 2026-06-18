import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Table, type TableColumn } from '@/components/ui/Table'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionCapacityBar } from '@/components/shared/SectionCapacityBar'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { getLecturerSections } from '@/lib/selectors'
import { courseService } from '@/services/course.api'
import { sectionService } from '@/services/section.api'

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
      <PageTitleBlock title="Giảng viên - Danh sách lớp được phân công" subtitle="Quản lý và theo dõi các lớp học phần được phân công giảng dạy trong học kỳ hiện tại." />
      <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-3">
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

export default AssignedSectionsPage;
