import { useEffect, useState } from 'react'
import { useAuthStore } from '@/app/store/auth.store'
import { useDataStore } from '@/app/store/data.store'
import { useUiStore } from '@/app/store/ui.store'
import { PageTitleBlock } from '@/components/layout/PageTitleBlock'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
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

  useEffect(() => {
    if (!currentUser?.roles.includes('STUDENT')) {
      return
    }

    const intervalId = window.setInterval(() => {
      wishService.listWishes({ studentId: currentUser.id }).catch(console.error)
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
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

export function WishPage() {
  const { currentUser, snapshot, pushToast } = useStudentContext()
  const [courseCode, setCourseCode] = useState(snapshot.courses[0]?.code ?? '')
  const [preferredGroup, setPreferredGroup] = useState('01')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentUser) {
    return <EmptyState title="Không tìm thấy sinh viên" description="Vui lòng đăng nhập lại." />
  }

  const student = currentUser
  const wishes = snapshot.wishes.filter((wish) => wish.studentId === student.id)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason.trim()) {
      pushToast({ tone: 'warning', title: 'Thiếu lý do', description: 'Vui lòng nhập lý do để gửi nguyện vọng.' })
      return
    }

    try {
      setIsSubmitting(true)
      await wishService.createWishRequest({
        studentId: student.id,
        semesterId: snapshot.settings.currentSemesterId,
        courseCode,
        preferredGroup,
        reason,
      })
      setReason('')
      pushToast({ tone: 'success', title: 'Đã gửi nguyện vọng', description: 'Nguyện vọng mới đã được lưu qua API backend.' })
    } catch (error) {
      pushToast({
        tone: 'error',
        title: 'Không thể gửi nguyện vọng',
        description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <PageTitleBlock title="Sinh viên - Đăng ký nguyện vọng" subtitle="Gửi nhu cầu mở thêm lớp hoặc đổi nhóm học phần, kèm danh sách các yêu cầu đã gửi." />
      <div className="grid gap-6 lg:grid-cols-[0.44fr_0.56fr]">
        <Card title="Gửi nguyện vọng mới" description="Mẫu BM_09 cho nhu cầu mở thêm lớp hoặc đổi nhóm">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Select
              label="Mã môn học"
              value={courseCode}
              onChange={(event) => setCourseCode(event.target.value)}
              options={snapshot.courses.map((c) => ({
                label: `${c.code} - ${c.name}`,
                value: c.code,
              }))}
            />
            <Input
              label="Nhóm / tổ mong muốn"
              value={preferredGroup}
              onChange={(event) => {
                const val = event.target.value
                if (val === '' || /^\d+$/.test(val)) {
                  setPreferredGroup(val)
                }
              }}
            />
            <Textarea label="Lý do" value={reason} onChange={(event) => setReason(event.target.value)} />
            <Button type="submit" disabled={isSubmitting}>
              Gửi nguyện vọng
            </Button>
          </form>
        </Card>

        <Card title="Danh sách nguyện vọng đã gửi" description="Theo dõi trạng thái xử lý của từng yêu cầu">
          {wishes.length ? (
            <div className="grid gap-3">
              {wishes.map((wish) => (
                <div key={wish.id} className="rounded-3xl border border-[var(--color-hairline)] bg-white px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {wish.courseCode} - Nhóm {wish.preferredGroup || '--'}
                      </p>
                      <p className="text-sm text-slate-500">{wish.reason}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-700">
                        {wish.status}
                      </span>
                      {wish.status === 'PENDING' ? (
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await wishService.cancelWishRequest(wish.id)
                              pushToast({ tone: 'info', title: 'Đã hủy nguyện vọng', description: 'Yêu cầu đã chuyển sang CANCELLED.' })
                            } catch (error) {
                              pushToast({
                                tone: 'error',
                                title: 'Không thể hủy nguyện vọng',
                                description: error instanceof Error ? error.message : 'Hệ thống không thể xử lý yêu cầu.',
                              })
                            }
                          }}
                          type="button"
                        >
                          Hủy
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có nguyện vọng nào" description="Hãy gửi nguyện vọng đầu tiên nếu cần mở thêm lớp hoặc đổi nhóm." />
          )}
        </Card>
      </div>
    </div>
  )
}

export default WishPage;
