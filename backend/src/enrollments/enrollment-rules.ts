export type EnrollmentStatus =
  | 'PENDING'
  | 'REGISTERED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'WAITLISTED'
  | 'DROPPED'

export type RegistrationErrorCode =
  | 'REG_ERR_SECTION_NOT_OPEN'
  | 'REG_ERR_OUTSIDE_REGISTRATION_WINDOW'
  | 'REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW'
  | 'REG_ERR_OUTSIDE_WITHDRAWAL_WINDOW'
  | 'REG_ERR_FULL_CAPACITY'
  | 'REG_ERR_PREREQUISITE_NOT_MET'
  | 'REG_ERR_PRESTUDY_NOT_MET'
  | 'REG_ERR_COREQUISITE_NOT_MET'
  | 'REG_ERR_SCHEDULE_CONFLICT'
  | 'REG_ERR_CREDIT_LIMIT_EXCEEDED'
  | 'REG_ERR_ALREADY_REGISTERED'
  | 'REG_ERR_ALREADY_REGISTERED_COURSE'
  | 'REG_ERR_CLASS_NOT_FOUND'
  | 'REG_ERR_STUDENT_NOT_FOUND'
  | 'REG_ERR_CANNOT_WITHDRAW'
  | 'REG_ERR_CLASS_CANCELLED'
  | 'REG_ERR_ACCOUNT_INACTIVE'
  | 'REG_ERR_MAX_CLASS_PER_DAY'
  | 'REG_ERR_MAX_CLASS_PER_SEMESTER'
  | 'REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER'

export type PdfRegistrationStatusCode = 'DK_TC' | 'HUY_DK' | 'KHONG_DU_DK' | 'NGOAI_TGDK'

export const REGISTRATION_ERROR_MESSAGES: Record<RegistrationErrorCode, string> = {
  REG_ERR_ALREADY_REGISTERED_COURSE: 'Sinh vien da dang ky hoac vao danh sach cho mot lop khac cua cung hoc phan trong hoc ky nay.',
  REG_ERR_SECTION_NOT_OPEN: 'Lớp học phần chưa mở đăng ký.',
  REG_ERR_OUTSIDE_REGISTRATION_WINDOW: 'Ngoài thời gian đăng ký của học kỳ này.',
  REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW: 'Ngoài thời gian điều chỉnh đăng ký.',
  REG_ERR_OUTSIDE_WITHDRAWAL_WINDOW: 'Đã quá hạn rút học phần.',
  REG_ERR_FULL_CAPACITY: 'Lớp học phần đã đủ sĩ số tối đa.',
  REG_ERR_PREREQUISITE_NOT_MET: 'Sinh viên chưa đạt môn tiên quyết.',
  REG_ERR_PRESTUDY_NOT_MET: 'Sinh viên chưa học môn học trước.',
  REG_ERR_COREQUISITE_NOT_MET: 'Sinh viên chưa đáp ứng môn song hành.',
  REG_ERR_SCHEDULE_CONFLICT: 'Thời khóa biểu bị trùng với học phần đã đăng ký.',
  REG_ERR_CREDIT_LIMIT_EXCEEDED: 'Vượt quá giới hạn số tín chỉ tối đa.',
  REG_ERR_ALREADY_REGISTERED: 'Sinh viên đã có bản ghi đăng ký cho lớp này.',
  REG_ERR_CLASS_NOT_FOUND: 'Không tìm thấy lớp học phần.',
  REG_ERR_STUDENT_NOT_FOUND: 'Không tìm thấy thông tin sinh viên.',
  REG_ERR_CANNOT_WITHDRAW: 'Không thể hủy hoặc rút học phần này.',
  REG_ERR_CLASS_CANCELLED: 'Lớp học phần đã bị hủy.',
  REG_ERR_ACCOUNT_INACTIVE: 'Tài khoản hiện không thể thực hiện thao tác này.',
  REG_ERR_MAX_CLASS_PER_DAY: 'Vượt quá số lớp tối đa trong một ngày.',
  REG_ERR_MAX_CLASS_PER_SEMESTER: 'Vượt quá tổng số lớp tối đa trong học kỳ.',
  REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER: 'Lớp học phần không thuộc học kỳ hiện tại.',
}

export interface RuleUser {
  id: string
  roles: string[]
  status: string
}

export interface RuleCourse {
  code: string
  credits: number
  prerequisites: unknown
  prestudy: unknown
  corequisites: unknown
}

export interface RuleSection {
  id: string
  courseCode: string
  semesterId: string
  weekday: number
  startPeriod: number
  periodCount: number
  weeks: string
  capacity: number
  registeredCount: number
  allowWaitlist: boolean
  status: string
}

export interface RuleEnrollment {
  id: string
  studentId: string
  sectionId: string
  semesterId: string
  status: EnrollmentStatus
}

export function mapEnrollmentStatusToPdfStatus(status: EnrollmentStatus): PdfRegistrationStatusCode {
  if (status === 'REGISTERED' || status === 'COMPLETED') {
    return 'DK_TC'
  }

  if (status === 'CANCELLED' || status === 'DROPPED') {
    return 'HUY_DK'
  }

  return 'KHONG_DU_DK'
}

export function mapRegistrationErrorToPdfStatus(errorCode?: RegistrationErrorCode): PdfRegistrationStatusCode {
  if (
    errorCode === 'REG_ERR_OUTSIDE_REGISTRATION_WINDOW' ||
    errorCode === 'REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW'
  ) {
    return 'NGOAI_TGDK'
  }

  return 'KHONG_DU_DK'
}

export interface RuleCourseCondition {
  courseCode: string
  requiredCourseCode: string
  type: 'PREREQUISITE' | 'PRESTUDY' | 'COREQUISITE'
}

export interface RuleStudentResult {
  studentId: string
  courseCode: string
  status: string
  passed: boolean
}

export interface RuleSettings {
  simulationNow: string
  registrationStart: string
  registrationEnd: string
  adjustmentStart: string
  adjustmentEnd: string
  withdrawalDeadline: string
  maxCredits: number
  maxClassesPerDay: number
  maxClassesPerSemester: number
  allowWaitlist: boolean
  currentSemesterId: string
}

export interface EligibilityContext {
  student?: RuleUser
  section?: RuleSection
  targetCourse?: RuleCourse
  courses: RuleCourse[]
  sections: RuleSection[]
  enrollments: RuleEnrollment[]
  courseConditions?: RuleCourseCondition[]
  studentResults?: RuleStudentResult[]
  settings: RuleSettings
}

export interface EligibilityOptions {
  ignoreRegistrationWindow?: boolean
  excludedEnrollmentId?: string
}

export interface EligibilityCheckResult {
  canRegister: boolean
  finalStatus: EnrollmentStatus | null
  pdfStatusCode?: PdfRegistrationStatusCode
  errorCode?: RegistrationErrorCode
  message: string
  checks: Array<{
    key: string
    label: string
    passed: boolean
    message: string
  }>
}

const HISTORY_PASS_STATUSES = new Set<EnrollmentStatus>(['COMPLETED'])
const HISTORY_RESULT_STATUSES = new Set<EnrollmentStatus>(['COMPLETED', 'FAILED'])
const ACTIVE_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>(['REGISTERED', 'WAITLISTED'])
const DUPLICATE_ENROLLMENT_STATUSES = new Set<EnrollmentStatus>(['REGISTERED', 'WAITLISTED', 'PENDING'])

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function conditionCodes(
  targetCourse: RuleCourse | undefined,
  courseConditions: RuleCourseCondition[] | undefined,
  type: RuleCourseCondition['type'],
  fallback: unknown,
) {
  const normalizedConditions = courseConditions?.filter(
    (condition) => condition.courseCode === targetCourse?.code && condition.type === type,
  )

  return normalizedConditions?.length
    ? normalizedConditions.map((condition) => condition.requiredCourseCode)
    : stringArray(fallback)
}

function isWithinRange(nowIso: string, startIso: string, endIso: string) {
  const now = new Date(nowIso).getTime()
  return now >= new Date(startIso).getTime() && now <= new Date(endIso).getTime()
}

export function parseWeeks(weeks: string): Set<number> {
  const trimmed = weeks.trim()
  if (!trimmed) {
    return new Set()
  }

  const result = new Set<number>()
  for (const segment of trimmed.split(',')) {
    const part = segment.trim()
    if (!part) continue

    const rangeParts = part.split('-')
    if (rangeParts.length === 1) {
      const num = Number(rangeParts[0].trim())
      if (!Number.isInteger(num) || num <= 0) {
        throw new Error(`Định dạng tuần không hợp lệ: "${part}". Giá trị phải là số nguyên dương.`)
      }
      result.add(num)
    } else if (rangeParts.length === 2) {
      const start = Number(rangeParts[0].trim())
      const end = Number(rangeParts[1].trim())
      if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0) {
        throw new Error(`Định dạng tuần không hợp lệ: "${part}". Giá trị phải là số nguyên dương.`)
      }
      if (end < start) {
        throw new Error(`Định dạng tuần không hợp lệ: "${part}". Giá trị kết thúc (${end}) phải >= giá trị bắt đầu (${start}).`)
      }
      for (let i = start; i <= end; i++) {
        result.add(i)
      }
    } else {
      throw new Error(`Định dạng tuần không hợp lệ: "${part}". Sử dụng dạng "1-15" hoặc "1,3,5".`)
    }
  }

  return result
}

export function weeksOverlap(a: string, b: string): boolean {
  const setA = parseWeeks(a)
  const setB = parseWeeks(b)
  if (setA.size === 0 || setB.size === 0) {
    return true
  }
  const arrA = Array.from(setA)
  for (let i = 0; i < arrA.length; i++) {
    if (setB.has(arrA[i])) return true
  }
  return false
}

export interface ScheduleConflictDetail {
  conflictSectionId: string
  weekday: number
  candidatePeriods: string
  conflictPeriods: string
  overlappingWeeks: number[]
}

function buildRuleResult(
  key: string,
  label: string,
  passed: boolean,
  successMessage: string,
  failureMessage: string,
  errorCode?: RegistrationErrorCode,
) {
  return {
    key,
    label,
    passed,
    message: passed ? successMessage : failureMessage,
    errorCode,
  }
}

export function calculateCurrentCredits(
  studentId: string,
  semesterId: string,
  enrollments: RuleEnrollment[],
  sections: RuleSection[],
  courses: RuleCourse[],
) {
  const activeSectionIds = new Set(
    enrollments
      .filter(
        (enrollment) =>
          enrollment.studentId === studentId &&
          enrollment.semesterId === semesterId &&
          ACTIVE_ENROLLMENT_STATUSES.has(enrollment.status),
      )
      .map((enrollment) => enrollment.sectionId),
  )

  return sections
    .filter((section) => activeSectionIds.has(section.id))
    .reduce((total, section) => {
      const course = courses.find((item) => item.code === section.courseCode)
      return total + (course?.credits ?? 0)
    }, 0)
}

export function checkScheduleConflict(
  candidate: RuleSection,
  comparedSections: RuleSection[],
): ScheduleConflictDetail | null {
  for (const section of comparedSections) {
    if (section.weekday !== candidate.weekday) {
      continue
    }

    const candidateEnd = candidate.startPeriod + candidate.periodCount
    const sectionEnd = section.startPeriod + section.periodCount
    const periodsOverlap = candidate.startPeriod < sectionEnd && section.startPeriod < candidateEnd
    if (!periodsOverlap) {
      continue
    }

    const candidateWeeks = parseWeeks(candidate.weeks)
    const sectionWeeks = parseWeeks(section.weeks)

    // If either has no weeks info, treat as overlapping (all weeks)
    if (candidateWeeks.size === 0 || sectionWeeks.size === 0) {
      return {
        conflictSectionId: section.id,
        weekday: candidate.weekday,
        candidatePeriods: `${candidate.startPeriod}-${candidateEnd - 1}`,
        conflictPeriods: `${section.startPeriod}-${sectionEnd - 1}`,
        overlappingWeeks: [],
      }
    }

    const overlapping: number[] = []
    const candidateArr = Array.from(candidateWeeks)
    for (let i = 0; i < candidateArr.length; i++) {
      if (sectionWeeks.has(candidateArr[i])) overlapping.push(candidateArr[i])
    }

    if (overlapping.length > 0) {
      overlapping.sort((a, b) => a - b)
      return {
        conflictSectionId: section.id,
        weekday: candidate.weekday,
        candidatePeriods: `${candidate.startPeriod}-${candidateEnd - 1}`,
        conflictPeriods: `${section.startPeriod}-${sectionEnd - 1}`,
        overlappingWeeks: overlapping,
      }
    }
  }

  return null
}

export function evaluateEnrollmentEligibility(
  context: EligibilityContext,
  options: EligibilityOptions = {},
): EligibilityCheckResult {
  const { student, section, targetCourse, courses, sections, settings } = context
  const enrollments = options.excludedEnrollmentId
    ? context.enrollments.filter((enrollment) => enrollment.id !== options.excludedEnrollmentId)
    : context.enrollments

  const studentEnrollments = enrollments.filter((item) => item.studentId === student?.id)
  const currentSemesterEnrollments = studentEnrollments.filter(
    (item) => item.semesterId === settings.currentSemesterId,
  )
  const currentSections = currentSemesterEnrollments
    .filter((item) => ACTIVE_ENROLLMENT_STATUSES.has(item.status))
    .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId))
    .filter((item): item is RuleSection => Boolean(item))

  const completedCourseCodes = new Set([
    ...(context.studentResults ?? [])
      .filter((item) => item.studentId === student?.id && item.passed)
      .map((item) => item.courseCode),
    ...studentEnrollments
      .filter((item) => HISTORY_PASS_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  ])

  const completedOrAttemptedCourseCodes = new Set([
    ...(context.studentResults ?? [])
      .filter((item) => item.studentId === student?.id)
      .map((item) => item.courseCode),
    ...studentEnrollments
      .filter((item) => HISTORY_RESULT_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  ])

  const currentSemesterCourseCodes = new Set(currentSections.map((item) => item.courseCode))
  const hasDuplicateSection = Boolean(
    section &&
      currentSemesterEnrollments.some(
        (item) => item.sectionId === section.id && DUPLICATE_ENROLLMENT_STATUSES.has(item.status),
      ),
  )
  const hasDuplicateCourse = Boolean(
    section &&
      currentSemesterEnrollments.some((item) => {
        if (!DUPLICATE_ENROLLMENT_STATUSES.has(item.status) || item.sectionId === section.id) {
          return false
        }

        return sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode === section.courseCode
      }),
  )
  const prerequisiteCodes = conditionCodes(
    targetCourse,
    context.courseConditions,
    'PREREQUISITE',
    targetCourse?.prerequisites,
  )
  const prestudyCodes = conditionCodes(targetCourse, context.courseConditions, 'PRESTUDY', targetCourse?.prestudy)
  const corequisiteCodes = conditionCodes(
    targetCourse,
    context.courseConditions,
    'COREQUISITE',
    targetCourse?.corequisites,
  )

  const checks = [
    buildRuleResult(
      'account',
      'Tài khoản hợp lệ',
      Boolean(student?.roles.includes('STUDENT') && student.status === 'ACTIVE'),
      'Tài khoản sinh viên đang hoạt động.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ACCOUNT_INACTIVE,
      student ? 'REG_ERR_ACCOUNT_INACTIVE' : 'REG_ERR_STUDENT_NOT_FOUND',
    ),
    buildRuleResult(
      'section-exists',
      'Tồn tại lớp học phần',
      Boolean(section),
      'Đã tìm thấy lớp học phần.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_CLASS_NOT_FOUND,
      'REG_ERR_CLASS_NOT_FOUND',
    ),
    buildRuleResult(
      'current-semester',
      'Thuộc học kỳ hiện tại',
      Boolean(section && section.semesterId === settings.currentSemesterId),
      'Lớp học phần thuộc học kỳ hiện hành.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER,
      'REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER',
    ),
    buildRuleResult(
      'section-status',
      'Trạng thái lớp',
      Boolean(section && (section.status === 'OPEN' || section.status === 'FULL')),
      'Lớp học phần đang mở đăng ký.',
      section?.status === 'CANCELLED'
        ? REGISTRATION_ERROR_MESSAGES.REG_ERR_CLASS_CANCELLED
        : REGISTRATION_ERROR_MESSAGES.REG_ERR_SECTION_NOT_OPEN,
      section?.status === 'CANCELLED' ? 'REG_ERR_CLASS_CANCELLED' : 'REG_ERR_SECTION_NOT_OPEN',
    ),
    buildRuleResult(
      'registration-window',
      'Cửa sổ đăng ký',
      options.ignoreRegistrationWindow ||
        isWithinRange(settings.simulationNow, settings.registrationStart, settings.registrationEnd),
      'Hệ thống đang nằm trong cửa sổ đăng ký.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_OUTSIDE_REGISTRATION_WINDOW,
      'REG_ERR_OUTSIDE_REGISTRATION_WINDOW',
    ),
    buildRuleResult(
      'duplicate',
      'Trùng lặp đăng ký',
      Boolean(section && !hasDuplicateSection),
      'Chưa có yêu cầu đăng ký trùng lặp.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ALREADY_REGISTERED,
      'REG_ERR_ALREADY_REGISTERED',
    ),
    buildRuleResult(
      'duplicate-course',
      'Trung hoc phan trong hoc ky',
      Boolean(section && !hasDuplicateCourse),
      'Chua co lop khac cua cung hoc phan trong hoc ky nay.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ALREADY_REGISTERED_COURSE,
      'REG_ERR_ALREADY_REGISTERED_COURSE',
    ),
    buildRuleResult(
      'prerequisite',
      'Điều kiện tiên quyết',
      Boolean(prerequisiteCodes.every((code) => completedCourseCodes.has(code))),
      'Sinh viên đáp ứng tất cả môn tiên quyết.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_PREREQUISITE_NOT_MET,
      'REG_ERR_PREREQUISITE_NOT_MET',
    ),
    buildRuleResult(
      'prestudy',
      'Điều kiện học trước',
      Boolean(prestudyCodes.every((code) => completedOrAttemptedCourseCodes.has(code))),
      'Sinh viên đã có kết quả cho tất cả môn học trước.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_PRESTUDY_NOT_MET,
      'REG_ERR_PRESTUDY_NOT_MET',
    ),
    buildRuleResult(
      'corequisite',
      'Điều kiện song hành',
      Boolean(
        corequisiteCodes.every(
          (code) => completedCourseCodes.has(code) || currentSemesterCourseCodes.has(code),
        ),
      ),
      'Môn song hành đã được hoàn thành hoặc đang đăng ký cùng kỳ.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_COREQUISITE_NOT_MET,
      'REG_ERR_COREQUISITE_NOT_MET',
    ),
    (() => {
      const conflict = section ? checkScheduleConflict(section, currentSections) : null
      const passed = Boolean(section && !conflict)
      let failMessage = REGISTRATION_ERROR_MESSAGES.REG_ERR_SCHEDULE_CONFLICT
      if (conflict) {
        const weekdayNames = ['', 'Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
        const dayName = weekdayNames[conflict.weekday] ?? `Thứ ${conflict.weekday}`
        const weeksInfo = conflict.overlappingWeeks.length > 0
          ? `, tuần ${conflict.overlappingWeeks.join(', ')}`
          : ''
        failMessage = `Trùng lịch với lớp ${conflict.conflictSectionId}: ${dayName}, tiết ${conflict.conflictPeriods}${weeksInfo}.`
      }
      return buildRuleResult(
        'schedule-conflict',
        'Trùng lịch học',
        passed,
        'Không phát hiện xung đột thời khóa biểu.',
        failMessage,
        'REG_ERR_SCHEDULE_CONFLICT',
      )
    })(),
    buildRuleResult(
      'credit-limit',
      'Giới hạn tín chỉ',
      Boolean(
        section &&
          targetCourse &&
          calculateCurrentCredits(student?.id ?? '', settings.currentSemesterId, enrollments, sections, courses) +
            targetCourse.credits <=
            settings.maxCredits,
      ),
      'Tổng tín chỉ sau đăng ký vẫn nằm trong ngưỡng cho phép.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_CREDIT_LIMIT_EXCEEDED,
      'REG_ERR_CREDIT_LIMIT_EXCEEDED',
    ),
    buildRuleResult(
      'class-per-day',
      'Số lớp tối đa trong ngày',
      Boolean(
        section &&
          currentSections.filter((item) => item.weekday === section.weekday).length + 1 <=
            settings.maxClassesPerDay,
      ),
      'Số lớp trong ngày vẫn nằm trong giới hạn.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_MAX_CLASS_PER_DAY,
      'REG_ERR_MAX_CLASS_PER_DAY',
    ),
    buildRuleResult(
      'class-per-semester',
      'Số lớp tối đa trong học kỳ',
      currentSections.length + 1 <= settings.maxClassesPerSemester,
      'Tổng số lớp học phần trong học kỳ vẫn hợp lệ.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_MAX_CLASS_PER_SEMESTER,
      'REG_ERR_MAX_CLASS_PER_SEMESTER',
    ),
  ]

  const firstFailedCheck = checks.find((item) => !item.passed)
  if (firstFailedCheck) {
    return {
      canRegister: false,
      finalStatus: null,
      message: firstFailedCheck.message,
      checks,
      errorCode: firstFailedCheck.errorCode,
      pdfStatusCode: mapRegistrationErrorToPdfStatus(firstFailedCheck.errorCode),
    }
  }

  if (!section || !targetCourse) {
    return {
      canRegister: false,
      finalStatus: null,
      errorCode: 'REG_ERR_CLASS_NOT_FOUND',
      pdfStatusCode: 'KHONG_DU_DK',
      message: REGISTRATION_ERROR_MESSAGES.REG_ERR_CLASS_NOT_FOUND,
      checks,
    }
  }

  const isFull = section.registeredCount >= section.capacity || section.status === 'FULL'
  if (isFull && section.allowWaitlist && settings.allowWaitlist) {
    return {
      canRegister: true,
      finalStatus: 'WAITLISTED',
      pdfStatusCode: mapEnrollmentStatusToPdfStatus('WAITLISTED'),
      message: 'Lớp đã đủ sĩ số, sinh viên sẽ được đưa vào danh sách chờ.',
      checks,
    }
  }

  if (isFull) {
    return {
      canRegister: false,
      finalStatus: null,
      errorCode: 'REG_ERR_FULL_CAPACITY',
      pdfStatusCode: 'KHONG_DU_DK',
      message: REGISTRATION_ERROR_MESSAGES.REG_ERR_FULL_CAPACITY,
      checks,
    }
  }

  return {
    canRegister: true,
    finalStatus: 'REGISTERED',
    pdfStatusCode: mapEnrollmentStatusToPdfStatus('REGISTERED'),
    message: 'Sinh viên đáp ứng đầy đủ điều kiện đăng ký.',
    checks,
  }
}

export function canCancelEnrollment(nowIso: string, settings: RuleSettings) {
  return isWithinRange(nowIso, settings.adjustmentStart, settings.adjustmentEnd)
}

export function canWithdrawEnrollment(nowIso: string, settings: RuleSettings) {
  return (
    new Date(nowIso).getTime() > new Date(settings.adjustmentEnd).getTime() &&
    new Date(nowIso).getTime() <= new Date(settings.withdrawalDeadline).getTime()
  )
}
