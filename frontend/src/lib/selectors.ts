import { calculateCurrentCredits } from '@/lib/business-rules'
import type { AccountStatus, UserRole } from '@/types/auth'
import type { Course, WishRequest } from '@/types/course'
import type { Enrollment, EnrollmentStatus } from '@/types/enrollment'
import type { AuditLog } from '@/types/log'
import type { ScheduleEntry } from '@/types/schedule'
import type { Section, SectionStatus } from '@/types/section'
import type { SemesterOption, SystemSettings } from '@/types/settings'
import type { User } from '@/types/user'

export interface SnapshotLike {
  users: User[]
  courses: Course[]
  sections: Section[]
  enrollments: Enrollment[]
  logs: AuditLog[]
  settings: SystemSettings
  wishes: WishRequest[]
  semesters?: SemesterOption[]
}

export interface SectionView {
  section: Section
  course: Course | null
  lecturer: User | null
  availableSeats: number
  derivedStatus: SectionStatus
}

export interface EnrollmentView {
  enrollment: Enrollment
  section: Section | null
  course: Course | null
  lecturer: User | null
}

export interface StudentPerformancePoint {
  label: string
  courseLabel: string
  value: number
}

export const WEEKDAY_LABELS: Record<Section['weekday'], string> = {
  2: 'Thứ 2',
  3: 'Thứ 3',
  4: 'Thứ 4',
  5: 'Thứ 5',
  6: 'Thứ 6',
  7: 'Thứ 7',
  8: 'Chủ nhật',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Sinh viên',
  LECTURER: 'Giảng viên',
  ACADEMIC_OFFICE: 'Phòng Đào tạo',
  ADMIN: 'Quản trị viên',
}

export const ACCOUNT_LABELS: Record<AccountStatus, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khóa',
  INACTIVE: 'Tạm ngưng',
}

const ACTIVE_ENROLLMENTS = new Set<EnrollmentStatus>(['REGISTERED', 'WAITLISTED'])

export function getDerivedSectionStatus(section: Section): SectionStatus {
  if (
    section.status === 'CANCELLED' ||
    section.status === 'COMPLETED' ||
    section.status === 'IN_PROGRESS'
  ) {
    return section.status
  }

  if (section.registeredCount >= section.capacity) {
    return 'FULL'
  }

  return section.status === 'CLOSED' ? 'CLOSED' : 'OPEN'
}

export function getCurrentSemesterLabel(
  settings: SystemSettings,
  semesters: SemesterOption[] = [],
) {
  return (
    semesters.find((semester) => semester.id === settings.currentSemesterId)?.label ??
    settings.currentSemesterId
  )
}

export function getWeekdayLabel(weekday: Section['weekday']) {
  return WEEKDAY_LABELS[weekday]
}

export function formatSectionPeriods(section: Pick<Section, 'startPeriod' | 'periodCount'>) {
  const endPeriod = section.startPeriod + section.periodCount - 1
  return `Tiết ${section.startPeriod}${endPeriod !== section.startPeriod ? ` - ${endPeriod}` : ''}`
}

export function formatSectionTime(
  section: Pick<Section, 'weekday' | 'startPeriod' | 'periodCount' | 'room'>,
) {
  return `${getWeekdayLabel(section.weekday)} • ${formatSectionPeriods(section)} • ${section.room}`
}

export function buildSectionView(
  section: Section,
  courses: Course[],
  users: User[],
): SectionView {
  const course = courses.find((item) => item.code === section.courseCode) ?? null
  const lecturer = users.find((item) => item.id === section.lecturerId) ?? null

  return {
    section,
    course,
    lecturer,
    availableSeats: Math.max(section.capacity - section.registeredCount, 0),
    derivedStatus: getDerivedSectionStatus(section),
  }
}

export function buildEnrollmentView(
  enrollment: Enrollment,
  sections: Section[],
  courses: Course[],
  users: User[],
): EnrollmentView {
  const section = sections.find((item) => item.id === enrollment.sectionId) ?? null
  const course = section ? courses.find((item) => item.code === section.courseCode) ?? null : null
  const lecturer = section ? users.find((item) => item.id === section.lecturerId) ?? null : null

  return {
    enrollment,
    section,
    course,
    lecturer,
  }
}

export function getCurrentSemesterSections(snapshot: SnapshotLike) {
  return snapshot.sections
    .filter((section) => section.semesterId === snapshot.settings.currentSemesterId)
    .map((section) => buildSectionView(section, snapshot.courses, snapshot.users))
}

export function getStudentSemesterEnrollments(
  snapshot: SnapshotLike,
  studentId: string,
  semesterId = snapshot.settings.currentSemesterId,
) {
  return snapshot.enrollments
    .filter((enrollment) => enrollment.studentId === studentId && enrollment.semesterId === semesterId)
    .map((enrollment) =>
      buildEnrollmentView(enrollment, snapshot.sections, snapshot.courses, snapshot.users),
    )
}

export function getStudentCurrentCredits(snapshot: SnapshotLike, studentId: string) {
  return calculateCurrentCredits(
    studentId,
    snapshot.settings.currentSemesterId,
    snapshot.enrollments,
    snapshot.sections,
    snapshot.courses,
  )
}

export function getStudentScheduleEntries(snapshot: SnapshotLike, studentId: string) {
  const rows = getStudentSemesterEnrollments(snapshot, studentId).filter((item) =>
    ACTIVE_ENROLLMENTS.has(item.enrollment.status),
  )

  return rows
    .filter((item) => item.section && item.course)
    .map((item) => {
      const section = item.section as Section
      const course = item.course as Course
      const entry: ScheduleEntry = {
        id: section.id,
        title: course.name,
        courseCode: course.code,
        sectionCode: section.sectionCode,
        weekday: section.weekday,
        startPeriod: section.startPeriod,
        periodCount: section.periodCount,
        room: section.room,
        lecturerName: item.lecturer?.fullName ?? 'Chưa phân công',
        weeks: section.weeks,
        enrollmentStatus: item.enrollment.status,
        sectionStatus: getDerivedSectionStatus(section),
      }
      return entry
    })
}

export function getLecturerSections(
  snapshot: SnapshotLike,
  lecturerId: string,
  semesterId = snapshot.settings.currentSemesterId,
) {
  return snapshot.sections
    .filter((section) => section.lecturerId === lecturerId && section.semesterId === semesterId)
    .map((section) => buildSectionView(section, snapshot.courses, snapshot.users))
}

export function getLecturerScheduleEntries(snapshot: SnapshotLike, lecturerId: string) {
  return getLecturerSections(snapshot, lecturerId).map((item) => {
    const entry: ScheduleEntry = {
      id: item.section.id,
      title: item.course?.name ?? item.section.sectionCode,
      courseCode: item.section.courseCode,
      sectionCode: item.section.sectionCode,
      weekday: item.section.weekday,
      startPeriod: item.section.startPeriod,
      periodCount: item.section.periodCount,
      room: item.section.room,
      lecturerName: item.lecturer?.fullName ?? 'Chưa phân công',
      weeks: item.section.weeks,
      sectionStatus: item.derivedStatus,
    }
    return entry
  })
}

export function getSectionStudents(snapshot: SnapshotLike, sectionId: string) {
  return snapshot.enrollments
    .filter((enrollment) => enrollment.sectionId === sectionId)
    .map((enrollment) => ({
      enrollment,
      student: snapshot.users.find((user) => user.id === enrollment.studentId) ?? null,
    }))
    .filter((item) => Boolean(item.student))
}

export function getSectionWaitlist(snapshot: SnapshotLike, sectionId: string) {
  return getSectionStudents(snapshot, sectionId)
    .filter((item) => item.enrollment.status === 'WAITLISTED')
    .sort(
      (left, right) =>
        (left.enrollment.waitlistOrder ?? Number.POSITIVE_INFINITY) -
        (right.enrollment.waitlistOrder ?? Number.POSITIVE_INFINITY),
    )
}

export function getRoleHomePath(role: UserRole) {
  switch (role) {
    case 'STUDENT':
      return '/student/open-sections'
    case 'LECTURER':
      return '/lecturer/sections'
    case 'ACADEMIC_OFFICE':
      return '/academic/registrations'
    case 'ADMIN':
      return '/admin/users'
    default:
      return '/'
  }
}

export function getRoleDashboardMetrics(snapshot: SnapshotLike, user: User) {
  const role = user.roles[0] ?? 'STUDENT'

  if (role === 'STUDENT') {
    const current = getStudentSemesterEnrollments(snapshot, user.id)
    return [
      {
        label: 'Tín chỉ hiện tại',
        value: String(getStudentCurrentCredits(snapshot, user.id)),
        hint: 'Tổng từ các lớp đang đăng ký hợp lệ',
      },
      {
        label: 'Đăng ký thành công',
        value: String(current.filter((item) => item.enrollment.status === 'REGISTERED').length),
        hint: 'Các học phần đang học trong kỳ',
      },
      {
        label: 'Danh sách chờ',
        value: String(current.filter((item) => item.enrollment.status === 'WAITLISTED').length),
        hint: 'Theo dõi để chuyển sang đăng ký chính thức',
      },
      {
        label: 'Học kỳ',
        value: String(current.length),
        hint: 'Tổng số trạng thái đã phát sinh',
      },
    ]
  }

  if (role === 'LECTURER') {
    const sections = getLecturerSections(snapshot, user.id)
    return [
      {
        label: 'Lớp phụ trách',
        value: String(sections.length),
        hint: 'Tổng số lớp trong học kỳ hiện tại',
      },
      {
        label: 'Tổng sĩ số',
        value: String(sections.reduce((sum, item) => sum + item.section.registeredCount, 0)),
        hint: 'Sinh viên đang theo học',
      },
      {
        label: 'Buổi giảng',
        value: String(sections.length),
        hint: 'Số buổi học phần đang quản lý',
      },
      {
        label: 'Phòng dạy',
        value: String(new Set(sections.map((item) => item.section.room)).size),
        hint: 'Các phòng đang sử dụng',
      },
    ]
  }

  if (role === 'ACADEMIC_OFFICE') {
    const sections = getCurrentSemesterSections(snapshot)
    const totalCapacity = sections.reduce((sum, item) => sum + item.section.capacity, 0)
    const totalRegistered = sections.reduce((sum, item) => sum + item.section.registeredCount, 0)
    const waitlisted = snapshot.enrollments.filter(
      (enrollment) =>
        enrollment.semesterId === snapshot.settings.currentSemesterId &&
        enrollment.status === 'WAITLISTED',
    ).length

    return [
      {
        label: 'Lớp đang mở',
        value: String(sections.filter((item) => item.derivedStatus === 'OPEN').length),
        hint: 'Sẵn sàng cho sinh viên đăng ký',
      },
      {
        label: 'Lớp đã đủ chỗ',
        value: String(sections.filter((item) => item.derivedStatus === 'FULL').length),
        hint: 'Cần theo dõi để xử lý waitlist',
      },
      {
        label: 'Tỷ lệ lấp đầy',
        value: `${Math.round((totalRegistered / Math.max(totalCapacity, 1)) * 100)}%`,
        hint: 'Toàn học kỳ hiện tại',
      },
      {
        label: 'Sinh viên chờ',
        value: String(waitlisted),
        hint: 'Tổng số WAITLISTED',
      },
    ]
  }

  const logsToday = snapshot.logs.filter(
    (log) => log.timestamp.slice(0, 10) === snapshot.settings.simulationNow.slice(0, 10),
  ).length

  return [
    {
      label: 'Người dùng hoạt động',
      value: String(snapshot.users.filter((item) => item.status === 'ACTIVE').length),
      hint: 'Tổng toàn bộ tài khoản có thể truy cập',
    },
    {
      label: 'Tài khoản bị khóa',
      value: String(snapshot.users.filter((item) => item.status === 'LOCKED').length),
      hint: 'Cần quản trị viên rà soát',
    },
    {
      label: 'Log hôm nay',
      value: String(logsToday),
      hint: 'Theo mốc thời gian mô phỏng hiện tại',
    },
    {
      label: 'Bảo trì hệ thống',
      value: snapshot.settings.maintenanceMode ? 'Đang bật' : 'Đang tắt',
      hint: 'Trạng thái ghi dữ liệu trên toàn app',
    },
  ]
}

export function getRelevantLogs(snapshot: SnapshotLike, user: User) {
  const role = user.roles[0] ?? 'STUDENT'

  if (role === 'STUDENT') {
    return snapshot.logs.filter((log) => log.actorId === user.id).slice(-6).reverse()
  }

  if (role === 'LECTURER') {
    const ownedSectionIds = new Set(
      getLecturerSections(snapshot, user.id).map((item) => item.section.id),
    )
    return snapshot.logs
      .filter((log) => log.actorId === user.id || ownedSectionIds.has(log.targetId))
      .slice(-6)
      .reverse()
  }

  return snapshot.logs.slice(-8).reverse()
}

export function getStudentInstructorContacts(snapshot: SnapshotLike, studentId: string) {
  const current = getStudentSemesterEnrollments(snapshot, studentId)
    .filter((item) => item.lecturer)
    .map((item) => item.lecturer as User)

  return Array.from(new Map(current.map((lecturer) => [lecturer.id, lecturer])).values()).slice(0, 5)
}

export function getStudentPerformanceSeries(user: User): StudentPerformancePoint[] {
  const gpaScore = Math.min(100, Math.round(((user.gpa ?? 3.1) / 4) * 100))
  const attendanceScore = Math.min(100, Math.round((user.attendanceRate ?? 0.84) * 100))

  return [
    {
      label: 'Lập trình',
      courseLabel: 'INT2101',
      value: Math.max(68, gpaScore + 6),
    },
    {
      label: 'Cơ sở dữ liệu',
      courseLabel: 'CSC1301',
      value: Math.max(64, attendanceScore - 2),
    },
    {
      label: 'Mạng máy tính',
      courseLabel: 'CSC1302',
      value: Math.max(62, gpaScore - 5),
    },
    {
      label: 'Kỹ năng nhóm',
      courseLabel: 'ELE2102',
      value: Math.max(70, attendanceScore + 4),
    },
  ]
}

export function getStudentAttendanceBreakdown(user: User) {
  const present = Math.min(100, Math.round((user.attendanceRate ?? 0.84) * 100))

  return {
    present,
    absent: Math.max(0, 100 - present),
  }
}
