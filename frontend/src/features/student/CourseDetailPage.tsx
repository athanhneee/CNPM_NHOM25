import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { InfoList } from '@/components/shared/InfoList'
import { RuleCheckPanel } from '@/components/shared/RuleCheckPanel'
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

export function CourseDetailPage() {
  const { sectionId } = useParams()
  const { currentUser, snapshot, pushToast, actor } = useStudentContext()
  const [loading, setLoading] = useState(false)

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const auditActor = actor

  const section = snapshot.sections.find((item) => item.id === sectionId)
  const course = snapshot.courses.find((item) => item.code === section?.courseCode)
  const lecturer = snapshot.users.find((item) => item.id === section?.lecturerId)

  if (!section || !course) {
    return <ErrorState title="Không tìm thấy học phần" description="Lớp học phần không tồn tại hoặc đã bị xóa." />
  }

  const eligibility = evaluateEnrollmentEligibility({
    nowIso: snapshot.settings.simulationNow,
    student,
    section,
    targetCourse: course,
    courses: snapshot.courses,
    sections: snapshot.sections,
    enrollments: snapshot.enrollments,
    settings: snapshot.settings,
  })

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Chi tiết học phần"
        subtitle="Xem đầy đủ thông tin lớp học phần, quy tắc tiên quyết và kết quả kiểm tra điều kiện trước khi đăng ký."
        actions={
          <Button
            loading={loading}
            onClick={async () => {
              setLoading(true)
              const result = await enrollmentService.registerSection(student.id, section.id, auditActor)
              setLoading(false)
              pushToast({
                tone: result.success ? 'success' : 'error',
                title: result.success ? 'Đăng ký thành công' : 'Đăng ký thất bại',
                description: result.message,
              })
            }}
            type="button"
          >
            Đăng ký
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
        <Card title={`${course.name} (${section.sectionCode})`} description="Thông tin tổng quan, lịch học và phạm vi áp dụng">
          <InfoList
            items={[
              { label: 'Mã môn học', value: course.code },
              { label: 'Tín chỉ', value: String(course.credits) },
              { label: 'Loại môn', value: course.courseType ?? 'Chưa phân loại' },
              { label: 'Khối kiến thức', value: course.academicBlock ?? 'Danh mục chung' },
              { label: 'Học kỳ gợi ý', value: course.suggestedSemester ? `Học kỳ ${course.suggestedSemester}` : 'Đang cập nhật' },
              { label: 'Ngành áp dụng', value: course.majorsSupported?.join(', ') || 'Danh mục chung' },
              { label: 'Giảng viên', value: lecturer?.fullName ?? '--' },
              { label: 'Phòng học', value: section.room },
              { label: 'Lịch học', value: `Thứ ${section.weekday} • Tiết ${section.startPeriod}-${section.startPeriod + section.periodCount - 1}` },
              { label: 'Tuần học', value: section.weeks },
              { label: 'Tiên quyết', value: course.prerequisites.join(', ') || 'Không có' },
              { label: 'Học trước', value: course.prestudy.join(', ') || 'Không có' },
              { label: 'Song hành', value: course.corequisites.join(', ') || 'Không có' },
            ]}
          />
        </Card>

        <RuleCheckPanel checks={eligibility.checks} summary={eligibility.message} />
      </div>
    </div>
  )
}

export default CourseDetailPage;
