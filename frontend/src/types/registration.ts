// ── Filter modes (must match backend enum CourseOptionsMode) ──────
export type FilterMode =
  | 'BY_COURSE'
  | 'OPEN_FOR_STUDENT_CLASS'
  | 'CURRICULUM_PLAN'
  | 'NOT_STUDIED_IN_CURRICULUM'
  | 'FAILED_COURSES'
  | 'BY_DEPARTMENT'
  | 'BY_SECTION'

// ── Academic status for a course relative to a student ────────────
export type AcademicStatus = 'NOT_STUDIED' | 'PASSED' | 'FAILED' | 'IN_PROGRESS' | 'REGISTERED'

// ── Registration status for a section ────────────────────────────
export type RegistrationStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'FULL'
  | 'CANCELLED'
  | 'WAITLIST'
  | 'REGISTERED'
  | 'PENDING'
  | 'UPCOMING'
  | 'LOCKED'

// ── Ineligibility reason from backend ────────────────────────────
export interface IneligibleReason {
  code: string
  message: string
}

// ── Schedule info for a section ──────────────────────────────────
export interface ScheduleInfo {
  weekday: number
  startPeriod: number
  periodCount: number
  room: string
  weeks: string
}

// ── Section option within a course ───────────────────────────────
export interface SectionOption {
  sectionId: string
  sectionCode: string
  lecturer: string | null
  capacity: number
  enrolled: number
  remainingSeats: number
  registrationStatus: RegistrationStatus
  eligible: boolean
  ineligibleReasons: IneligibleReason[]
  schedules: ScheduleInfo[]
}

// ── Course option ────────────────────────────────────────────────
export interface CourseOption {
  courseId: string
  courseCode: string
  courseName: string
  credits: number
  department: string
  faculty: string | null
  category: string
  suggestedSemester: number | null
  academicStatus: AcademicStatus
  retakeInfo?: {
    attemptCount: number
    lastGrade: string | null
    lastSemester: string | null
  }
  sections: SectionOption[]
}

// ── Full response from /registration/course-options ──────────────
export interface CourseOptionsResponse {
  mode: FilterMode
  student: {
    id: string
    studentCode: string
    fullName: string
    studentClass: { code: string } | null
    curriculum: { name: string } | null
  }
  term: {
    id: string
    name: string
  }
  courses: CourseOption[]
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ── Query params ─────────────────────────────────────────────────
export interface CourseOptionsQuery {
  studentId?: string
  studentClassCode?: string
  termId?: string
  mode: FilterMode
  courseCode?: string
  department?: string
  sectionCode?: string
  keyword?: string
  page?: number
  limit?: number
}

// ── Filter mode display config ───────────────────────────────────
export interface FilterModeOption {
  label: string
  value: FilterMode
}

export const FILTER_MODE_OPTIONS: FilterModeOption[] = [
  { label: 'Lọc theo môn học', value: 'BY_COURSE' },
  { label: 'Môn học mở theo lớp sinh viên', value: 'OPEN_FOR_STUDENT_CLASS' },
  { label: 'Môn trong chương trình đào tạo kế hoạch', value: 'CURRICULUM_PLAN' },
  { label: 'Môn chưa học trong CTĐT kế hoạch', value: 'NOT_STUDIED_IN_CURRICULUM' },
  { label: 'Môn sinh viên cần học lại (đã rớt)', value: 'FAILED_COURSES' },
  { label: 'Lọc theo khoa quản lý môn học', value: 'BY_DEPARTMENT' },
  { label: 'Lọc theo lớp học phần', value: 'BY_SECTION' },
]

// ── Status display helpers ───────────────────────────────────────
export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  OPEN: 'Đang mở đăng ký',
  CLOSED: 'Đã đóng đăng ký',
  FULL: 'Đã đầy',
  CANCELLED: 'Đã hủy',
  WAITLIST: 'Danh sách chờ',
  REGISTERED: 'Đã đăng ký',
  PENDING: 'Chờ duyệt',
  UPCOMING: 'Sắp mở đăng ký',
  LOCKED: 'Đã khóa',
}

export const REGISTRATION_STATUS_COLORS: Record<RegistrationStatus, string> = {
  OPEN: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  FULL: 'bg-orange-100 text-orange-700 border-orange-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  WAITLIST: 'bg-amber-100 text-amber-700 border-amber-200',
  REGISTERED: 'bg-blue-100 text-blue-700 border-blue-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  UPCOMING: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  LOCKED: 'bg-gray-200 text-gray-700 border-gray-300',
}

export const ACADEMIC_STATUS_LABELS: Record<AcademicStatus, string> = {
  NOT_STUDIED: 'Chưa học',
  PASSED: 'Đã đạt',
  FAILED: 'Cần học lại',
  IN_PROGRESS: 'Đang học',
  REGISTERED: 'Đã đăng ký',
}

export const ACADEMIC_STATUS_COLORS: Record<AcademicStatus, string> = {
  NOT_STUDIED: 'bg-gray-50 text-gray-600',
  PASSED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
  IN_PROGRESS: 'bg-sky-50 text-sky-700',
  REGISTERED: 'bg-blue-50 text-blue-700',
}
