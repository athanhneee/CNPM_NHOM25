import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Table, type TableColumn } from '@/components/ui/Table'
import { FilterBar } from '@/components/shared/FilterBar'
import { SearchInput } from '@/components/shared/SearchInput'
import { enrollmentService } from '@/services/enrollment.api'
import { courseService } from '@/services/course.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
import type { Course } from '@/types/course'
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

export function PrerequisitePage() {
  const { snapshot } = useStudentContext()
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 15

  const filteredRows = snapshot.courseRelations.filter((item) => {
    if (!query) {
      return true
    }

    const keyword = query.toLowerCase()
    return item.courseCode.toLowerCase().includes(keyword) || item.courseName.toLowerCase().includes(keyword)
  })



  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE)
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const paginatedRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  const columns: TableColumn<(typeof filteredRows)[number]>[] = [
    { key: 'course', header: 'Môn đăng ký', render: (row) => `${row.courseCode} - ${row.courseName}` },
    { key: 'required', header: 'Môn yêu cầu', render: (row) => `${row.requiredCourseCode} - ${row.requiredCourseName}` },
    { key: 'type', header: 'Loại quan hệ', render: (row) => row.relationType },
    { key: 'program', header: 'Hệ đào tạo', render: (row) => row.program },
    { key: 'department', header: 'Khoa', render: (row) => row.department },
  ]

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Xem môn tiên quyết" subtitle="Tra cứu các quan hệ prerequisite, prestudy và corequisite cho các học phần trong catalog." />
      <FilterBar>
        <SearchInput label="Tìm theo mã / tên môn học" placeholder="SEC2201..." value={query} onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }} />
      </FilterBar>
      <Table columns={columns} rows={paginatedRows} rowKey={(row) => row.id} />
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-[var(--color-hairline)] bg-white px-6 py-4 shadow-sm">
          <p className="text-sm text-[var(--color-muted)]">
            Hiển thị <span className="font-medium text-[var(--color-ink)]">{startIndex + 1}</span> đến <span className="font-medium text-[var(--color-ink)]">{Math.min(startIndex + PAGE_SIZE, filteredRows.length)}</span> trong tổng số <span className="font-medium text-[var(--color-ink)]">{filteredRows.length}</span> môn học
          </p>
          <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm font-medium text-[var(--color-ink)]">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="!flex !h-10 !w-10 items-center justify-center rounded-full !p-0"
                    >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PrerequisitePage;
