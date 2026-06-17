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
    { key: 'status', header: 'Trạng thái', render: (row) => <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>{row.status}</span> },
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

export function CreateSectionPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [form, setForm] = useState({
    sectionCode: 'INT3999-01',
    courseCode: snapshot.courses[0]?.code ?? '',
    group: '01',
    subGroup: '01',
    lecturerId: snapshot.users.find((user) => user.roles.includes('LECTURER'))?.id ?? '',
    room: 'A1-101',
    weekday: '2',
    startPeriod: '1',
    periodCount: '3',
    capacity: '40',
    weeks: '1-15',
    allowWaitlist: true,
  })
  const roomOptions = useMemo(
    () => buildRoomOptions(snapshot.sections.map((section) => section.room)),
    [snapshot.sections],
  )

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const rows = getCurrentSemesterSections(snapshot).slice(0, 8)

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Tạo lớp học phần" subtitle="Khởi tạo lớp học phần mới trong học kỳ, đồng thời kiểm tra xung đột phòng và giảng viên." />

      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card title="Biểu mẫu tạo lớp học phần" description="Nhập thông tin cơ bản để tạo section mới">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Mã lớp học phần" value={form.sectionCode} onChange={(event) => setForm((value) => ({ ...value, sectionCode: event.target.value }))} />
            <Input label="Mã môn học" value={form.courseCode} onChange={(event) => setForm((value) => ({ ...value, courseCode: event.target.value }))} list="course-options" />
            <Input label="Nhóm" value={form.group} onChange={(event) => setForm((value) => ({ ...value, group: event.target.value }))} />
            <Input label="Tổ" value={form.subGroup} onChange={(event) => setForm((value) => ({ ...value, subGroup: event.target.value }))} />
            <Input label="Giảng viên" value={form.lecturerId} onChange={(event) => setForm((value) => ({ ...value, lecturerId: event.target.value }))} list="lecturer-options" />
            <Input label="Phòng học" value={form.room} onChange={(event) => setForm((value) => ({ ...value, room: event.target.value }))} list="create-room-options" />
            <Input label="Thu" value={form.weekday} onChange={(event) => setForm((value) => ({ ...value, weekday: event.target.value }))} />
            <Input label="Tiết bắt đầu" value={form.startPeriod} onChange={(event) => setForm((value) => ({ ...value, startPeriod: event.target.value }))} />
            <Input label="Số tiết" value={form.periodCount} onChange={(event) => setForm((value) => ({ ...value, periodCount: event.target.value }))} />
            <Input label="Sức chứa" value={form.capacity} onChange={(event) => setForm((value) => ({ ...value, capacity: event.target.value }))} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                try {
                  await sectionService.createSection({
                    sectionCode: form.sectionCode,
                    courseCode: form.courseCode,
                    semesterId: snapshot.settings.currentSemesterId,
                    group: form.group,
                    subGroup: form.subGroup,
                    lecturerId: form.lecturerId,
                    room: form.room,
                    weekday: Number(form.weekday) as 2 | 3 | 4 | 5 | 6 | 7 | 8,
                    startPeriod: Number(form.startPeriod),
                    periodCount: Number(form.periodCount),
                    weeks: form.weeks,
                    capacity: Number(form.capacity),
                    allowWaitlist: form.allowWaitlist,
                    status: 'OPEN',
                    campus: 'HCM',
                  }, actor)
                  pushToast({ tone: 'success', title: 'Đã tạo lớp học phần', description: 'Section mới đã được thêm vào học kỳ hiện tại.' })
                } catch (error) {
                  pushToast({ tone: 'error', title: 'Không thể tạo section', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                }
              }}
              type="button"
            >
              Lưu section
            </Button>
          </div>
          <datalist id="course-options">
            {snapshot.courses.map((course) => (
              <option key={course.id} value={course.code} />
            ))}
          </datalist>
          <datalist id="lecturer-options">
            {snapshot.users.filter((user) => user.roles.includes('LECTURER')).map((lecturer) => (
              <option key={lecturer.id} value={lecturer.id} />
            ))}
          </datalist>
          <datalist id="create-room-options">
            {roomOptions.map((roomOption) => (
              <option key={roomOption} value={roomOption} />
            ))}
          </datalist>
        </Card>

        <Card title="Lớp học phần tạo gần đây" description="Danh sách nhanh để đối chiếu xung đột và tình trạng mở lớp">
          <div className="grid gap-3">
            {rows.map((row) => (
              <div key={row.section.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
                <div className="mt-3">
                  <InfoList items={[{ label: 'Phòng', value: row.section.room }, { label: 'Giảng viên', value: row.lecturer?.fullName ?? '--' }, { label: 'Lịch', value: `Thứ ${row.section.weekday} - Tiết ${row.section.startPeriod}` }]} compact />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export function AssignLecturerPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [nextLecturerId, setNextLecturerId] = useState('')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const selectedSection = sections.find((item) => item.section.id === selectedSectionId)
  const lecturers = snapshot.users.filter((user) => user.roles.includes('LECTURER'))

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Phân công giảng viên" subtitle="Gán giảng viên cho lớp học phần và kiểm tra trùng lịch trước khi lưu thay đổi." />

      <div className="grid gap-6 lg:grid-cols-[0.58fr_0.42fr]">
        <Card title="Danh sách section cần phân công" description="Chọn section và cập nhật giảng viên phụ trách">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-2xl border px-4 py-4 text-left ${selectedSectionId === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => {
                  setSelectedSectionId(row.section.id)
                  setNextLecturerId(row.section.lecturerId)
                }}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Cập nhật giảng viên" description="Xem thông tin lớp và chọn giảng viên mới">
          {selectedSection ? (
            <div className="grid gap-4">
              <InfoList items={[{ label: 'Lớp học phần', value: selectedSection.section.sectionCode }, { label: 'Môn học', value: selectedSection.course?.name ?? selectedSection.section.courseCode }, { label: 'Lịch', value: `Thứ ${selectedSection.section.weekday} - Tiết ${selectedSection.section.startPeriod}` }, { label: 'Giảng viên hiện tại', value: selectedSection.lecturer?.fullName ?? '--' }]} />
              <Input label="Giảng viên mới" value={nextLecturerId} onChange={(event) => setNextLecturerId(event.target.value)} list="academic-lecturer-options" />
              <Button
                onClick={async () => {
                  try {
                    await sectionService.assignLecturer(selectedSection.section.id, nextLecturerId, actor)
                    pushToast({ tone: 'success', title: 'Đã cập nhật giảng viên', description: 'Lớp học phần đã được cập nhật người phụ trách.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể phân công giảng viên', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Phân công
              </Button>
              <datalist id="academic-lecturer-options">
                {lecturers.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id} />
                ))}
              </datalist>
            </div>
          ) : (
            <EmptyState title="Chưa chọn section" description="Hãy chọn một lớp học phần ở cột bên trái để cập nhật giảng viên." />
          )}
        </Card>
      </div>
    </div>
  )
}

export function RegistrationManagementPage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [capacity, setCapacity] = useState('60')
  const [reason, setReason] = useState('Mở rộng chỉ tiêu để xử lý nhóm nhu cầu cao.')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot)
  const selected = sections.find((item) => item.section.id === selectedSectionId) ?? sections[0]
  const students = selected ? getSectionStudents(snapshot, selected.section.id) : []

  const columns: TableColumn<(typeof students)[number]>[] = [
    { key: 'code', header: 'MSSV', render: (row) => row.student?.code ?? '--' },
    { key: 'name', header: 'Họ và tên', render: (row) => row.student?.fullName ?? '--' },
    { key: 'program', header: 'Lớp', render: (row) => row.student?.studentClass ?? row.student?.program ?? '--' },
    { key: 'status', header: 'Trạng thái', render: (row) => <StatusBadge kind="enrollment" status={row.enrollment.status} /> },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Quản lý đăng ký học phần" subtitle="Theo dõi sĩ số, sinh viên đăng ký, danh sách chờ và điều chỉnh chỉ tiêu section trong học kỳ." />
      <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
        <Card title="Tổng hợp section" description="Chọn section để xem danh sách sinh viên và cập nhật chỉ tiêu">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-2xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => {
                  setSelectedSectionId(row.section.id)
                  setCapacity(String(row.section.capacity))
                }}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.course?.name ?? row.section.courseCode}</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {selected ? (
          <div className="grid gap-6">
            <Card title="Thông tin section" description="Cập nhật chỉ tiêu và xử lý danh sách chờ">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoList items={[{ label: 'Lớp học phần', value: selected.section.sectionCode }, { label: 'Môn học', value: selected.course?.name ?? selected.section.courseCode }, { label: 'Đã đăng ký', value: String(selected.section.registeredCount) }, { label: 'Danh sách chờ', value: String(selected.section.waitlistCount) }]} />
                <div className="grid gap-3">
                  <Input label="Sức chứa mới" value={capacity} onChange={(event) => setCapacity(event.target.value)} />
                  <Textarea label="Lý do điều chỉnh" value={reason} onChange={(event) => setReason(event.target.value)} />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={async () => {
                        try {
                          await sectionService.updateCapacity(selected.section.id, Number(capacity), reason, actor)
                          pushToast({ tone: 'success', title: 'Đã cập nhật chỉ tiêu', description: 'Section đã được cập nhật sức chứa mới.' })
                        } catch (error) {
                          pushToast({ tone: 'error', title: 'Không thể cập nhật chỉ tiêu', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                        }
                      }}
                      type="button"
                    >
                      Lưu điều chỉnh
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const promoted = await enrollmentService.processWaitlist(selected.section.id, actor)
                        pushToast({ tone: promoted.length ? 'success' : 'info', title: 'Xử lý danh sách chờ hoàn tất', description: promoted.length ? `Đã chuyển ${promoted.length} sinh viên sang DK_TC.` : 'Chưa có bản ghi nào đủ điều kiện.' })
                      }}
                      type="button"
                    >
                      Xử lý danh sách chờ
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Danh sách sinh viên" description="Hiển thị theo quy ước PDF: DK_TC, HUY_DK, KHONG_DU_DK hoặc NGOAI_TGDK">
              <Table columns={columns} rows={students} rowKey={(row) => row.enrollment.id} />
            </Card>
          </div>
        ) : (
          <EmptyState title="Chưa có section nào" description="Không có dữ liệu section để quản lý." />
        )}
      </div>
    </div>
  )
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
                className={`rounded-2xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
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
            <div className="mt-4 flex flex-wrap gap-3">
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

export function ReportsPage() {
  const { currentUser, snapshot } = useAcademicContext()
  const [backendRows, setBackendRows] = useState<ReportRow[] | null>(null)
  const [backendStats, setBackendStats] = useState<UtilizationStats | null>(null)
  const [reportError, setReportError] = useState('')
  const currentSemesterId = snapshot.settings.currentSemesterId

  const fallbackRows = useMemo(
    () =>
      getCurrentSemesterSections(snapshot).map((row) => ({
        id: row.section.id,
        sectionCode: row.section.sectionCode,
        courseCode: row.section.courseCode,
        courseName: row.course?.name ?? row.section.courseCode,
        lecturerName: row.lecturer?.fullName ?? '--',
        capacity: row.section.capacity,
        registeredCount: row.section.registeredCount,
        waitlistCount: row.section.waitlistCount,
        utilizationRate: row.section.capacity ? row.section.registeredCount / row.section.capacity : 0,
        status: row.derivedStatus,
      })),
    [snapshot],
  )
  const rows = backendRows ?? fallbackRows
  const stats = backendStats ?? {
    totalSections: rows.length,
    totalCapacity: rows.reduce((sum, row) => sum + row.capacity, 0),
    totalRegistered: rows.reduce((sum, row) => sum + row.registeredCount, 0),
    totalWaitlisted: rows.reduce((sum, row) => sum + row.waitlistCount, 0),
    averageUtilization: rows.reduce((sum, row) => sum + row.utilizationRate, 0) / Math.max(rows.length, 1),
    fullSections: rows.filter((row) => row.status === 'FULL').length,
  }

  useEffect(() => {
    if (!currentUser) {
      return
    }

    let cancelled = false

    Promise.all([
      reportService.getRegistrationSummary(currentSemesterId),
      reportService.getUtilizationStats(currentSemesterId),
    ])
      .then(([nextRows, nextStats]) => {
        if (cancelled) {
          return
        }
        setBackendRows(nextRows)
        setBackendStats(nextStats)
        setReportError('')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }
        setBackendRows(null)
        setBackendStats(null)
        setReportError(error instanceof Error ? error.message : 'Không tải được báo cáo từ backend.')
      })

    return () => {
      cancelled = true
    }
  }, [currentSemesterId, currentUser])

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Phòng đào tạo - Thống kê và báo cáo"
        subtitle="Tổng hợp tỷ lệ lấp đầy, section full và tình hình phân bổ giảng viên trong học kỳ."
        actions={<ExportButtons fileName="academic-reports.csv" onExportCsv={() => void reportService.exportReportCsv('academic-reports.csv', currentSemesterId)} />}
      />
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Tổng lớp" value={String(stats.totalSections)} hint="Học kỳ hiện tại" />
        <StatCard label="Tổng sức chứa" value={String(stats.totalCapacity)} hint="Tất cả lớp đang mở" />
        <StatCard label="Đã đăng ký" value={String(stats.totalRegistered)} hint="Sinh viên DK_TC" />
        <StatCard label="Tỷ lệ lấp đầy" value={`${Math.round(stats.averageUtilization * 100)}%`} hint="Theo tổng sức chứa" />
        <StatCard label="Lớp full" value={String(stats.fullSections)} hint="Cần cân nhắc mở thêm lớp" />
        <StatCard label="Waitlist" value={String(stats.totalWaitlisted)} hint="Sinh viên đang chờ" />
      </div>
      {reportError ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {reportError}
        </div>
      ) : null}
      <Card title="Bảng báo cáo" description="Tổng hợp theo lớp học phần, giảng viên và sĩ số">
        <div className="grid gap-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{row.sectionCode} - {row.courseName}</p>
                  <p className="text-sm text-slate-500">{row.lecturerName}</p>
                </div>
                <StatusBadge kind="section" status={row.status as SectionStatus} />
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-teal-500" style={{ width: `${Math.min(row.utilizationRate * 100, 100)}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {row.registeredCount}/{row.capacity} sinh viên - {Math.round(row.utilizationRate * 100)}% - waitlist {row.waitlistCount}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${wishStatusClassNames[status]}`}>
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
          <p className="text-xs text-slate-500">{row.student?.code ?? row.wish.studentId}</p>
        </div>
      ),
    },
    {
      key: 'course',
      header: 'Học phần',
      render: (row) => (
        <div className="grid gap-1">
          <p className="font-semibold text-slate-900">{row.wish.courseCode}</p>
          <p className="text-xs text-slate-500">{row.course?.name ?? 'Chưa có tên học phần'}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Lý do',
      render: (row) => (
        <div className="max-w-xl">
          <p className="text-sm leading-6 text-slate-700">{row.wish.reason}</p>
          <p className="mt-1 text-xs text-slate-500">
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
      <div className="grid gap-4 lg:grid-cols-4">
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

export function WaitlistOverridePage() {
  const { currentUser, snapshot, pushToast, actor } = useAcademicContext()
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [studentId, setStudentId] = useState(snapshot.users.find((user) => user.roles.includes('STUDENT'))?.id ?? '')
  const [reason, setReason] = useState('Cần can thiệp theo đề xuất nghiệp vụ.')

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy tài khoản phòng đào tạo" description="Vui lòng đăng nhập lại." />
  }

  const sections = getCurrentSemesterSections(snapshot).filter((section) => section.section.waitlistCount > 0 || section.derivedStatus === 'FULL')
  const selected = sections.find((item) => item.section.id === selectedSectionId) ?? sections[0]
  const waitlistRows = selected ? getSectionWaitlist(snapshot, selected.section.id) : []

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Phòng đào tạo - Danh sách chờ và can thiệp" subtitle="Xử lý danh sách chờ theo thứ tự và can thiệp đặc biệt có lý do, đồng thời ghi nhật ký cho mọi thay đổi." />
      <div className="grid gap-6 lg:grid-cols-[0.54fr_0.46fr]">
        <Card title="Danh sách chờ" description="Chọn lớp học phần để xem hàng chờ và xử lý nhanh">
          <div className="grid gap-3">
            {sections.map((row) => (
              <button
                key={row.section.id}
                className={`rounded-2xl border px-4 py-4 text-left ${selected?.section.id === row.section.id ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'}`}
                onClick={() => setSelectedSectionId(row.section.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{row.section.sectionCode}</p>
                    <p className="text-sm text-slate-500">{row.section.waitlistCount} sinh viên đang chờ</p>
                  </div>
                  <StatusBadge kind="section" status={row.derivedStatus} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card title="Thứ tự danh sách chờ" description="Hiển thị theo thứ tự xử lý của lớp học phần đang chọn">
            {waitlistRows.length ? (
              <div className="grid gap-3">
                {waitlistRows.map((row) => (
                  <div key={row.enrollment.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                    <p className="font-semibold text-slate-900">{row.student?.fullName ?? row.student?.code}</p>
                    <p className="text-sm text-slate-500">Thứ tự chờ: {row.enrollment.waitlistOrder ?? '--'}</p>
                  </div>
                ))}
                <Button
                  onClick={async () => {
                    if (!selected) {
                      return
                    }
                    const promoted = await enrollmentService.processWaitlist(selected.section.id, actor)
                    pushToast({ tone: promoted.length ? 'success' : 'info', title: 'Xử lý danh sách chờ hoàn tất', description: promoted.length ? `Đã chuyển ${promoted.length} sinh viên sang DK_TC.` : 'Không có bản ghi nào đủ điều kiện.' })
                  }}
                  type="button"
                >
                  Xử lý theo thứ tự
                </Button>
              </div>
            ) : (
              <EmptyState title="Chưa có danh sách chờ" description="Lớp học phần đang chọn chưa có sinh viên trong hàng chờ." />
            )}
          </Card>

          <Card title="Can thiệp thủ công" description="Nhập lý do bắt buộc và chọn sinh viên cần can thiệp đăng ký">
            <div className="grid gap-4">
              <Input label="MSSV / Mã người dùng" value={studentId} onChange={(event) => setStudentId(event.target.value)} list="override-student-options" />
              <Textarea label="Lý do can thiệp" value={reason} onChange={(event) => setReason(event.target.value)} />
              <Button
                onClick={async () => {
                  if (!selected) {
                    return
                  }
                  try {
                    await enrollmentService.overrideEnrollment(studentId, selected.section.id, reason, actor)
                    pushToast({ tone: 'success', title: 'Can thiệp thành công', description: 'Bản ghi đăng ký đã được cập nhật và ghi log.' })
                  } catch (error) {
                    pushToast({ tone: 'error', title: 'Không thể can thiệp', description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý.' })
                  }
                }}
                type="button"
              >
                Can thiệp đăng ký
              </Button>
              <datalist id="override-student-options">
                {snapshot.users.filter((user) => user.roles.includes('STUDENT')).map((student) => (
                  <option key={student.id} value={student.id} />
                ))}
              </datalist>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}


