import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Table, type TableColumn } from '@/components/ui/Table'
import { Textarea } from '@/components/ui/Textarea'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatCard } from '@/components/shared/StatCard'
import { courseService } from '@/services/course.api'
import { enrollmentService } from '@/services/enrollment.api'
import { sectionService } from '@/services/section.api'
import type { Course, WishRequest } from '@/types/course'

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export function CourseCatalogPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [query, setQuery] = useState('')
  const [majorFilter, setMajorFilter] = useState('ALL')
  const [blockFilter, setBlockFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [semesterFilter, setSemesterFilter] = useState('ALL')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [deleteId, setDeleteId] = useState('')
  const [form, setForm] = useState({
    code: 'INT3999',
    name: 'Học phần mới',
    credits: '3',
    department: 'Khoa Công nghệ thông tin',
    campus: 'HCM',
    description: 'Học phần được tạo từ giao diện phòng đào tạo.',
    status: 'ACTIVE',
    courseType: DEFAULT_COURSE_TYPE,
    academicBlock: DEFAULT_ACADEMIC_BLOCK,
    majorsSupported: 'Công nghệ thông tin',
    suggestedSemester: '6',
  })

  const majorOptions = useMemo(
    () =>
      Array.from(
        new Set(snapshot.courses.flatMap((course) => course.majorsSupported ?? [])),
      ).sort((left, right) => left.localeCompare(right, 'vi')),
    [snapshot.courses],
  )

  const blockOptions = useMemo(
    () =>
      Array.from(
        new Set(
          snapshot.courses
            .map((course) => course.academicBlock)
            .filter((value): value is AcademicBlockValue => value !== undefined),
        ),
      ),
    [snapshot.courses],
  )

  const typeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          snapshot.courses
            .map((course) => course.courseType)
            .filter((value): value is CourseTypeValue => value !== undefined),
        ),
      ),
    [snapshot.courses],
  )

  const rows = snapshot.courses.filter((course) => {
    const keyword = query.trim().toLowerCase()
    const matchesQuery =
      !keyword ||
      course.code.toLowerCase().includes(keyword) ||
      course.name.toLowerCase().includes(keyword) ||
      course.description.toLowerCase().includes(keyword)
    const matchesMajor =
      majorFilter === 'ALL' || Boolean(course.majorsSupported?.includes(majorFilter))
    const matchesBlock =
      blockFilter === 'ALL' || course.academicBlock === blockFilter
    const matchesType = typeFilter === 'ALL' || course.courseType === typeFilter
    const matchesSemester =
      semesterFilter === 'ALL' || String(course.suggestedSemester ?? '') === semesterFilter

    return (
      matchesQuery &&
      matchesMajor &&
      matchesBlock &&
      matchesType &&
      matchesSemester
    )
  })

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const columns: TableColumn<(typeof rows)[number]>[] = [
    { key: 'code', header: 'Mã môn học', render: (row) => row.code },
    { key: 'name', header: 'Tên môn học', render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: 'major', header: 'Ngành áp dụng', render: (row) => row.majorsSupported?.join(', ') ?? 'Danh mục chung' },
    { key: 'courseType', header: 'Loại môn', render: (row) => row.courseType ?? '--' },
    { key: 'semester', header: 'HK gợi ý', render: (row) => (row.suggestedSemester ? `HK ${row.suggestedSemester}` : '--') },
    { key: 'credits', header: 'Tín chỉ', render: (row) => String(row.credits) },
    { key: 'prereq', header: 'Tiên quyết', render: (row) => row.prerequisites.join(', ') || 'Không có' },
    { key: 'prestudy', header: 'Học trước', render: (row) => row.prestudy.join(', ') || 'Không có' },
    { key: 'status', header: 'Trạng thái', render: (row) => <span className={`rounded-full px-3 py-1 text-sm font-semibold ${row.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span> },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            onClick={() => {
              setEditingId(row.id)
              setForm({
                code: row.code,
                name: row.name,
                credits: String(row.credits),
                department: row.department,
                campus: row.campus,
                description: row.description,
                status: row.status,
                courseType: row.courseType ?? DEFAULT_COURSE_TYPE,
                academicBlock: row.academicBlock ?? DEFAULT_ACADEMIC_BLOCK,
                majorsSupported: row.majorsSupported?.join(', ') ?? 'Công nghệ thông tin',
                suggestedSemester: row.suggestedSemester ? String(row.suggestedSemester) : '',
              })
              setDrawerOpen(true)
            }}
            type="button"
          >
            Sửa
          </Button>
          <Button onClick={() => setDeleteId(row.id)} type="button" variant="danger">
            Xóa mềm
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Phòng đào tạo - Quản lý danh mục môn học"
        subtitle="Cập nhật catalog học phần, quan hệ học vụ và trạng thái sử dụng cho toàn hệ thống mô phỏng."
        actions={
          <Button
            onClick={() => {
              setEditingId('')
              setDrawerOpen(true)
            }}
            type="button"
          >
            Thêm môn học
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <StatCard label="Tổng học phần" value={String(snapshot.courses.length)} hint="Toàn bộ catalog" />
        <StatCard label="Đang hoạt động" value={String(snapshot.courses.filter((course) => course.status === 'ACTIVE').length)} hint="Có thể mở lớp học phần" />
        <StatCard label="Tạm ngưng" value={String(snapshot.courses.filter((course) => course.status === 'INACTIVE').length)} hint="Tạm ẩn khỏi quy trình" />
        <StatCard label="Có điều kiện" value={String(snapshot.courses.filter((course) => course.prerequisites.length || course.prestudy.length || course.corequisites.length).length)} hint="Tiên quyết / học trước / song hành" />
      </div>

      <FilterBar>
        <SearchInput label="Tìm môn học" placeholder="INT2102, an toàn mạng..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Input label="Ngành" value={majorFilter} onChange={(event) => setMajorFilter(event.target.value)} list="course-major-options" />
        <Input label="Khối kiến thức" value={blockFilter} onChange={(event) => setBlockFilter(event.target.value)} list="course-block-options" />
        <Input label="Loại môn" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} list="course-type-options" />
        <Input label="Học kỳ gợi ý" value={semesterFilter} onChange={(event) => setSemesterFilter(event.target.value)} list="course-semester-options" />
      </FilterBar>
      <datalist id="course-major-options">
        <option value="ALL" />
        {majorOptions.map((major) => (
          <option key={major} value={major} />
        ))}
      </datalist>
      <datalist id="course-block-options">
        <option value="ALL" />
        {blockOptions.map((block) => (
          <option key={block} value={block} />
        ))}
      </datalist>
      <datalist id="course-type-options">
        <option value="ALL" />
        {typeOptions.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <datalist id="course-semester-options">
        <option value="ALL" />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
          <option key={semester} value={String(semester)} />
        ))}
      </datalist>

      <Table columns={columns} rows={rows} rowKey={(row) => row.id} />

      <Drawer open={drawerOpen} title={editingId ? 'Cập nhật học phần' : 'Thêm học phần mới'} onClose={() => setDrawerOpen(false)}>
        <div className="grid gap-4">
          <Input label="Mã môn học" value={form.code} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} />
          <Input label="Tên môn học" value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} />
          <Input label="Tín chỉ" value={form.credits} onChange={(event) => setForm((value) => ({ ...value, credits: event.target.value }))} />
          <Input label="Ngành áp dụng" value={form.majorsSupported} onChange={(event) => setForm((value) => ({ ...value, majorsSupported: event.target.value }))} />
          <Input label="Loại môn" value={form.courseType} onChange={(event) => setForm((value) => ({ ...value, courseType: event.target.value as CourseTypeValue }))} list="form-course-type-options" />
          <Input label="Khối kiến thức" value={form.academicBlock} onChange={(event) => setForm((value) => ({ ...value, academicBlock: event.target.value as AcademicBlockValue }))} list="form-course-block-options" />
          <Input label="Học kỳ gợi ý" value={form.suggestedSemester} onChange={(event) => setForm((value) => ({ ...value, suggestedSemester: event.target.value }))} />
          <Textarea label="Mô tả" value={form.description} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} />
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                try {
                  const majorsSupported = normalizeMajors(form.majorsSupported)
                  const majorCodesSupported = majorsSupported
                    .map((major) => MAJOR_CODE_BY_NAME[major])
                    .filter((value): value is string => Boolean(value))
                  const suggestedSemester = form.suggestedSemester
                    ? Number(form.suggestedSemester)
                    : null
                  if (editingId) {
                    await courseService.updateCourse(editingId, {
                      code: form.code,
                      name: form.name,
                      credits: Number(form.credits),
                      description: form.description,
                      department: form.department,
                      campus: form.campus,
                      status: form.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                      courseType: form.courseType,
                      academicBlock: form.academicBlock,
                      majorsSupported,
                      majorCodesSupported,
                      faculty: form.department,
                      category: resolveCourseCategory(form.academicBlock, form.courseType),
                      ...(suggestedSemester ? { suggestedSemester } : {}),
                    }, actor)
                  } else {
                    await courseService.createCourse({
                      code: form.code,
                      name: form.name,
                      credits: Number(form.credits),
                      description: form.description,
                      department: form.department,
                      campus: form.campus,
                      status: form.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                      prerequisites: [],
                      prestudy: [],
                      corequisites: [],
                      category: resolveCourseCategory(form.academicBlock, form.courseType),
                      courseType: form.courseType,
                      academicBlock: form.academicBlock,
                      majorsSupported,
                      majorCodesSupported,
                      faculty: form.department,
                      ...(suggestedSemester ? { suggestedSemester } : {}),
                    }, actor)
                  }
                  pushToast({ tone: 'success', title: editingId ? 'Đã cập nhật học phần' : 'Đã tạo học phần', description: 'Catalog môn học đã được đồng bộ.' })
                  setDrawerOpen(false)
                } catch (error) {
                  pushToast({ tone: 'error', title: 'Không thể lưu học phần', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                }
              }}
              type="button"
            >
              Lưu
            </Button>
            <Button onClick={() => setDrawerOpen(false)} type="button" variant="ghost">
              Hủy
            </Button>
          </div>
          <datalist id="form-course-type-options">
            {typeOptions.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
          <datalist id="form-course-block-options">
            {blockOptions.map((block) => (
              <option key={block} value={block} />
            ))}
          </datalist>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Xác nhận xóa mềm học phần"
        description="Nếu học phần đã phát sinh lớp học phần thì hệ thống sẽ chặn thao tác này."
        confirmLabel="Xóa mềm"
        danger
        onClose={() => setDeleteId('')}
        onConfirm={async () => {
          try {
            await courseService.softDeleteCourse(deleteId, actor)
            pushToast({ tone: 'success', title: 'Đã xóa mềm học phần', description: 'Trạng thái môn học đã được cập nhật sang INACTIVE.' })
          } catch (error) {
            pushToast({ tone: 'error', title: 'Không thể xóa học phần', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
          } finally {
            setDeleteId('')
          }
        }}
      />
    </div>
  )
}

export default CourseCatalogPage;
