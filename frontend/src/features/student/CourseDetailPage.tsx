import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import type { EligibilityCheckResult } from '@/types/enrollment'
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
import { CircleCheck, Clock } from 'lucide-react'
import { enrollmentService } from '@/services/enrollment.api'
import { courseService } from '@/services/course.api'
import { sectionService } from '@/services/section.api'
import { wishService } from '@/services/wish.api'
import type { Course } from '@/types/course'
import type { User } from '@/types/user'

const ACADEMIC_BLOCK_LABELS: Record<string, string> = {
  generalEducationCourses: 'Khối kiến thức chung',
  foundationCourses: 'Cơ sở ngành',
  majorCoreCourses: 'Chuyên ngành',
  specializationCourses: 'Chuyên sâu',
  electiveCourses: 'Tự chọn',
}

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

  const student = currentUser
  const auditActor = actor

  const section = snapshot.sections.find((item) => item.id === sectionId)
  const course = snapshot.courses.find((item) => item.code === section?.courseCode)

  const localEligibility = useMemo(() => {
    if (!student || !section || !course) return null
    return evaluateEnrollmentEligibility({
      nowIso: snapshot.settings.simulationNow,
      student,
      section,
      targetCourse: course,
      courses: snapshot.courses,
      sections: snapshot.sections,
      enrollments: snapshot.enrollments,
      settings: snapshot.settings,
    })
  }, [student, section, course, snapshot.courses, snapshot.sections, snapshot.enrollments, snapshot.settings])

  const [eligibility, setEligibility] = useState<EligibilityCheckResult | null>(localEligibility)

  useEffect(() => {
    if (!section || !student) return
    let active = true
    enrollmentService.checkEligibility(student.id, section.id)
      .then((res) => {
        if (active) {
          setEligibility(res)
        }
      })
      .catch((err) => {
        console.error('Lỗi kiểm tra điều kiện từ hệ thống:', err)
      })
    return () => {
      active = false
    }
  }, [student, section, snapshot.enrollments])

  if (!currentUser || !actor) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  if (!section || !course || !eligibility) {
    if (!section || !course) {
      return <ErrorState title="Không tìm thấy học phần" description="Lớp học phần không tồn tại hoặc đã bị xóa." />
    }
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  const currentEnrollment = snapshot.enrollments.find(
    (e) => e.sectionId === section.id && ['REGISTERED', 'WAITLISTED', 'PENDING'].includes(e.status)
  )

  return (
    <div className="grid gap-6">
      <PageTitleBlock
        title="Sinh viên - Chi tiết học phần"
        subtitle="Xem đầy đủ thông tin lớp học phần, quy tắc tiên quyết và kết quả kiểm tra điều kiện trước khi đăng ký."
        actions={
          currentEnrollment ? (
            <Button
              loading={loading}
              variant="secondary"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ring-red-200"
              onClick={async () => {
                setLoading(true)
                try {
                  await enrollmentService.cancelEnrollment(currentEnrollment.id, auditActor)
                  pushToast({
                    tone: 'success',
                    title: 'Hủy đăng ký thành công',
                    description: 'Đã hủy thành công lớp học phần này.',
                  })
                } catch (error) {
                  pushToast({
                    tone: 'error',
                    title: 'Lỗi hủy đăng ký',
                    description: error instanceof Error ? error.message : 'Có lỗi xảy ra',
                  })
                } finally {
                  setLoading(false)
                }
              }}
              type="button"
            >
              Hủy đăng ký
            </Button>
          ) : (
            <Button
              loading={loading}
              disabled={!eligibility.canRegister}
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
              {eligibility.canRegister ? 'Đăng ký' : 'Không đủ điều kiện'}
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[0.56fr_0.44fr]">
        <Card title={`${course.name} (${section.sectionCode})`} description="Thông tin tổng quan, lịch học và phạm vi áp dụng">
          <InfoList
            items={[
              { label: 'Mã môn học', value: course.code },
              { label: 'Tín chỉ', value: String(course.credits) },
              { label: 'Loại môn', value: course.courseType ?? 'Chưa phân loại' },
              { label: 'Khối kiến thức', value: course.academicBlock ? (ACADEMIC_BLOCK_LABELS[course.academicBlock] || course.academicBlock) : 'Danh mục chung' },
              { label: 'Học kỳ gợi ý', value: course.suggestedSemester ? `Học kỳ ${course.suggestedSemester}` : 'Đang cập nhật' },
              { label: 'Ngành áp dụng', value: course.majorsSupported?.join(', ') || 'Danh mục chung' },
              { label: 'Giảng viên', value: section.lecturerName ?? '--' },
              { label: 'Phòng học', value: section.room },
              { label: 'Lịch học', value: `Thứ ${section.weekday} • Tiết ${section.startPeriod}-${section.startPeriod + section.periodCount - 1}` },
              { label: 'Tuần học', value: section.weeks },
              { label: 'Tiên quyết', value: course.prerequisites.join(', ') || 'Không có' },
              { label: 'Học trước', value: course.prestudy.join(', ') || 'Không có' },
              { label: 'Song hành', value: course.corequisites.join(', ') || 'Không có' },
            ]}
          />
        </Card>

        {currentEnrollment ? (
          <Card title="Trạng thái đăng ký" description="Lớp học phần này đã được lưu vào danh sách của bạn.">
            <div className="flex flex-col items-center justify-center py-16 text-center h-full">
              <div className={`rounded-full p-4 mb-4 ${currentEnrollment.status === 'WAITLISTED' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                {currentEnrollment.status === 'WAITLISTED' ? (
                  <Clock className="h-10 w-10 text-amber-600" />
                ) : (
                  <CircleCheck className="h-10 w-10 text-emerald-600" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {currentEnrollment.status === 'WAITLISTED' ? 'Đang chờ xếp lớp' : 'Đã đăng ký thành công'}
              </h3>
              <p className="text-slate-500 text-[15px] max-w-[300px]">
                {currentEnrollment.status === 'WAITLISTED'
                  ? 'Bạn đang ở danh sách chờ. Hệ thống sẽ tự động đăng ký khi có người hủy lớp.'
                  : 'Lớp học phần này đã được xác nhận vào Thời khóa biểu của bạn trong học kỳ này.'}
              </p>
            </div>
          </Card>
        ) : (
          <RuleCheckPanel checks={eligibility.checks} summary={eligibility.message} />
        )}
      </div>
    </div>
  )
}

export default CourseDetailPage;
