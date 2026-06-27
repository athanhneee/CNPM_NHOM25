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
  | 'REG_ERR_ALREADY_PASSED'
  | 'REG_ERR_MAX_RETAKE_EXCEEDED'
  | 'REG_ERR_CLASS_NOT_FOUND'
  | 'REG_ERR_STUDENT_NOT_FOUND'
  | 'REG_ERR_CANNOT_WITHDRAW'
  | 'REG_ERR_CLASS_CANCELLED'
  | 'REG_ERR_ACCOUNT_INACTIVE'
  | 'REG_ERR_MAX_CLASS_PER_DAY'
  | 'REG_ERR_MAX_CLASS_PER_SEMESTER'
  | 'REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER'
  | 'REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS'

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
  REG_ERR_ALREADY_PASSED: 'Sinh viên đã tích lũy môn học này và hệ thống không cho phép học cải thiện.',
  REG_ERR_MAX_RETAKE_EXCEEDED: 'Sinh viên đã vượt quá số lần học lại cho phép của môn học này.',
  REG_ERR_STUDENT_NOT_FOUND: 'Không tìm thấy thông tin sinh viên.',
  REG_ERR_CANNOT_WITHDRAW: 'Không thể hủy hoặc rút học phần này.',
  REG_ERR_CLASS_CANCELLED: 'Lớp học phần đã bị hủy.',
  REG_ERR_ACCOUNT_INACTIVE: 'Tài khoản hiện không thể thực hiện thao tác này.',
  REG_ERR_MAX_CLASS_PER_DAY: 'Vượt quá số lớp tối đa trong một ngày.',
  REG_ERR_MAX_CLASS_PER_SEMESTER: 'Vượt quá tổng số lớp tối đa trong học kỳ.',
  REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER: 'Lớp học phần không thuộc học kỳ hiện tại.',
  REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS: 'Sinh viên chưa tích lũy đủ số tín chỉ tối thiểu yêu cầu cho môn học này.',
}

export interface RuleUser {
  id: string
  roles: string[]
  status: string
  completedCredits?: number
  cohort?: string
  majorCode?: string
}

export interface RuleCourse {
  code: string
  credits: number
  requiredAccumulatedCredits?: number | null
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
  additionalSchedules?: unknown
  makeUpSchedules?: unknown
  cancelledDates?: unknown
  capacity: number
  minCapacity: number
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
  type: 'PREREQUISITE' | 'PRESTUDY' | 'COREQUISITE' | 'EQUIVALENT' | 'REPLACEMENT'
}

export interface RuleStudentResult {
  studentId: string
  courseCode: string
  status: string
  passed: boolean
}

function getExpandedCourseCodes(baseCodes: Set<string>, courseConditions?: RuleCourseCondition[]): Set<string> {
  const expanded = new Set(baseCodes)
  let added = true
  while (added) {
    added = false
    courseConditions?.forEach(cond => {
      if (cond.type === 'EQUIVALENT' || cond.type === 'REPLACEMENT') {
        if (expanded.has(cond.requiredCourseCode) && !expanded.has(cond.courseCode)) {
          expanded.add(cond.courseCode)
          added = true
        }
        if (expanded.has(cond.courseCode) && !expanded.has(cond.requiredCourseCode)) {
          expanded.add(cond.requiredCourseCode)
          added = true
        }
      }
    })
  }
  return expanded
}

export interface RuleRegistrationPhase {
  id: string
  name: string
  startDate: string
  endDate: string
  allowedCohorts: unknown
  allowedMajors: unknown
  maxCredits: number | null
  allowRegister: boolean
  allowCancel: boolean
}

export interface RuleSettings {
  simulationNow: string
  registrationStart: string
  registrationEnd: string
  adjustmentStart: string
  adjustmentEnd: string
  withdrawalDeadline: string
  maxCreditsMain: number
  maxCreditsSummer: number
  maxClassesPerDay: number
  maxClassesPerSemester: number
  allowWaitlist: boolean
  countWaitlistCredits: boolean
  allowGradeImprovement: boolean
  maxRetakeAttempts: number
  semesterType: 'MAIN' | 'SUMMER'
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
  phases?: RuleRegistrationPhase[]
  semesterStartDate?: string
}

export interface EligibilityOptions {
  ignoreRegistrationWindow?: boolean
  ignoreCapacity?: boolean
  excludedEnrollmentId?: string
}

export interface EligibilityCheckResult {
  canRegister: boolean
  finalStatus: EnrollmentStatus | null
  pdfStatusCode?: PdfRegistrationStatusCode
  errorCode?: RegistrationErrorCode
  message: string
  isRetake?: boolean
  isImprovement?: boolean
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
  settings?: RuleSettings,
) {
  const countWaitlisted = settings?.countWaitlistCredits ?? false;
  
  const activeSectionIds = new Set(
    enrollments
      .filter(
        (enrollment) =>
          enrollment.studentId === studentId &&
          enrollment.semesterId === semesterId &&
          (enrollment.status === 'REGISTERED' || (countWaitlisted && enrollment.status === 'WAITLISTED')),
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

interface FlattenedSchedule {
  weekday: number
  startPeriod: number
  periodCount: number
  weekIndex?: number
  dateStr?: string // YYYY-MM-DD
}

function expandSchedules(section: RuleSection, _semesterStartDate?: string): FlattenedSchedule[] {
  const result: FlattenedSchedule[] = []

  // Helper to parse specific structure
  const addWeekly = (weekday: number, startPeriod: number, periodCount: number, weeksStr: string) => {
    const activeWeeks = Array.from(parseWeeks(weeksStr))
    if (activeWeeks.length === 0) {
      // If no weeks info, push one record without weekIndex to represent "all weeks"
      result.push({ weekday, startPeriod, periodCount })
      return
    }

    for (const weekIdx of activeWeeks) {
      result.push({ weekday, startPeriod, periodCount, weekIndex: weekIdx })
    }
  }

  // 1. Primary Schedule
  addWeekly(section.weekday, section.startPeriod, section.periodCount, section.weeks)

  // 2. Additional Schedules
  if (Array.isArray(section.additionalSchedules)) {
    for (const sch of section.additionalSchedules as any[]) {
      if (typeof sch.weekday === 'number' && typeof sch.startPeriod === 'number' && typeof sch.periodCount === 'number') {
        addWeekly(sch.weekday, sch.startPeriod, sch.periodCount, sch.weeks || '')
      }
    }
  }

  // 3. MakeUp Schedules (Fallback to mapping Date to Weekday if possible)
  if (Array.isArray(section.makeUpSchedules)) {
    for (const mk of section.makeUpSchedules as any[]) {
      if (mk.date && typeof mk.startPeriod === 'number' && typeof mk.periodCount === 'number') {
        const d = new Date(mk.date)
        const jsDay = d.getDay()
        const weekday = jsDay === 0 ? 8 : jsDay + 1 // Map JS Day (0-6) to VN Weekday (2-8)
        result.push({
          weekday,
          startPeriod: mk.startPeriod,
          periodCount: mk.periodCount,
          dateStr: mk.date, // Store exact date to avoid false positive
        })
      }
    }
  }

  // 4. Filter out cancelled dates
  if (Array.isArray(section.cancelledDates)) {
    const cancelledSet = new Set(section.cancelledDates as string[])
    return result.filter(r => !r.dateStr || !cancelledSet.has(r.dateStr))
  }

  return result
}

function checkPeriodOverlap(start1: number, count1: number, start2: number, count2: number) {
  return start1 < start2 + count2 && start2 < start1 + count1
}

export function checkScheduleConflict(
  candidate: RuleSection,
  comparedSections: RuleSection[],
  semesterStartDate?: string,
): ScheduleConflictDetail | null {
  const candidateSchedules = expandSchedules(candidate, semesterStartDate)

  for (const section of comparedSections) {
    const sectionSchedules = expandSchedules(section, semesterStartDate)

    const overlappingWeeks: number[] = []
    let conflictWeekday = 0
    let conflictCandidatePeriods = ''
    let conflictPeriods = ''
    let hasGenericOverlap = false

    for (const cSch of candidateSchedules) {
      for (const sSch of sectionSchedules) {
        if (cSch.weekday !== sSch.weekday) continue
        if (!checkPeriodOverlap(cSch.startPeriod, cSch.periodCount, sSch.startPeriod, sSch.periodCount)) continue

        conflictWeekday = cSch.weekday
        conflictCandidatePeriods = `${cSch.startPeriod}-${cSch.startPeriod + cSch.periodCount - 1}`
        conflictPeriods = `${sSch.startPeriod}-${sSch.startPeriod + sSch.periodCount - 1}`

        // If both have exact dates, they must match
        if (cSch.dateStr && sSch.dateStr) {
          if (cSch.dateStr === sSch.dateStr) {
            if (cSch.weekIndex && !overlappingWeeks.includes(cSch.weekIndex)) {
              overlappingWeeks.push(cSch.weekIndex)
            }
          }
        }
        // If both have weekIndex, they must match
        else if (cSch.weekIndex !== undefined && sSch.weekIndex !== undefined) {
          if (cSch.weekIndex === sSch.weekIndex) {
            if (!overlappingWeeks.includes(cSch.weekIndex)) {
              overlappingWeeks.push(cSch.weekIndex)
            }
          }
        }
        // If one is generic (no week/date), it overlaps everything on that weekday
        else {
          hasGenericOverlap = true
        }
      }
    }

    if (overlappingWeeks.length > 0 || hasGenericOverlap) {
      overlappingWeeks.sort((a, b) => a - b)
      return {
        conflictSectionId: section.id,
        weekday: conflictWeekday,
        candidatePeriods: conflictCandidatePeriods,
        conflictPeriods,
        overlappingWeeks,
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

  const completedCourseCodes = getExpandedCourseCodes(new Set([
    ...(context.studentResults ?? [])
      .filter((item) => item.studentId === student?.id && item.passed)
      .map((item) => item.courseCode),
    ...studentEnrollments
      .filter((item) => HISTORY_PASS_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  ]), context.courseConditions)

  const completedOrAttemptedCourseCodes = getExpandedCourseCodes(new Set([
    ...(context.studentResults ?? [])
      .filter((item) => item.studentId === student?.id)
      .map((item) => item.courseCode),
    ...studentEnrollments
      .filter((item) => HISTORY_RESULT_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  ]), context.courseConditions)

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

  const isImprovement = Boolean(targetCourse && completedCourseCodes.has(targetCourse.code))
  const failedCount = context.studentResults?.filter(r => r.courseCode === targetCourse?.code && !r.passed).length ?? 0
  const isRetake = Boolean(targetCourse && failedCount > 0)

  // Registration Phase Evaluation
  let activePhase: RuleRegistrationPhase | null = null
  let isWithinPhase = false
  if (context.phases && context.phases.length > 0) {
    const simulationNow = new Date(settings.simulationNow).getTime()
    activePhase = context.phases.find(p => {
      const start = new Date(p.startDate).getTime()
      const end = new Date(p.endDate).getTime()
      if (simulationNow < start || simulationNow > end) return false

      if (p.allowedCohorts && Array.isArray(p.allowedCohorts) && p.allowedCohorts.length > 0) {
        if (!student?.cohort || !p.allowedCohorts.includes(student.cohort)) return false
      }
      if (p.allowedMajors && Array.isArray(p.allowedMajors) && p.allowedMajors.length > 0) {
        if (!student?.majorCode || !p.allowedMajors.includes(student.majorCode)) return false
      }
      return true
    }) ?? null

    if (activePhase && activePhase.allowRegister) {
      isWithinPhase = true
    }
  }

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
      Boolean(section && (section.status === 'OPEN' || section.status === 'FULL' || options.ignoreCapacity)),
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
        (context.phases && context.phases.length > 0
          ? isWithinPhase
          : isWithinRange(settings.simulationNow, settings.registrationStart, settings.registrationEnd)),
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
      'already-passed',
      'Điều kiện học cải thiện',
      !(isImprovement && !settings.allowGradeImprovement),
      'Môn học chưa được tích lũy hoặc hệ thống cho phép học cải thiện.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ALREADY_PASSED,
      'REG_ERR_ALREADY_PASSED',
    ),
    buildRuleResult(
      'max-retake',
      'Giới hạn học lại',
      !(isRetake && failedCount >= settings.maxRetakeAttempts),
      'Chưa vượt quá số lần học lại cho phép.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_MAX_RETAKE_EXCEEDED,
      'REG_ERR_MAX_RETAKE_EXCEEDED',
    ),
    buildRuleResult(
      'accumulated-credits',
      'Điều kiện tổng tín chỉ tích lũy',
      Boolean(!targetCourse?.requiredAccumulatedCredits || (student?.completedCredits ?? 0) >= targetCourse.requiredAccumulatedCredits),
      `Sinh viên đã tích lũy đủ số tín chỉ tối thiểu yêu cầu (${targetCourse?.requiredAccumulatedCredits ?? 0} tín chỉ).`,
      REGISTRATION_ERROR_MESSAGES.REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS,
      'REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS',
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
      const conflict = section ? checkScheduleConflict(section, currentSections, context.semesterStartDate) : null
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
          calculateCurrentCredits(student?.id ?? '', settings.currentSemesterId, enrollments, sections, courses, settings) +
            targetCourse.credits <=
            (activePhase?.maxCredits ?? (settings.semesterType === 'SUMMER' ? settings.maxCreditsSummer : settings.maxCreditsMain)),
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
      isRetake,
      isImprovement,
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
      isRetake,
      isImprovement,
      checks,
    }
  }

  const isFull = section.registeredCount >= section.capacity || section.status === 'FULL'
  
  if (isFull && options.ignoreCapacity) {
    return {
      canRegister: true,
      finalStatus: 'REGISTERED',
      pdfStatusCode: mapEnrollmentStatusToPdfStatus('REGISTERED'),
      message: 'Lớp đã đủ sĩ số nhưng được cấp quyền đăng ký vượt rào.',
      isRetake,
      isImprovement,
      checks,
    }
  }

  if (isFull && section.allowWaitlist && settings.allowWaitlist) {
    return {
      canRegister: true,
      finalStatus: 'WAITLISTED',
      pdfStatusCode: mapEnrollmentStatusToPdfStatus('WAITLISTED'),
      message: 'Lớp đã đủ sĩ số, sinh viên sẽ được đưa vào danh sách chờ.',
      isRetake,
      isImprovement,
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
      isRetake,
      isImprovement,
      checks,
    }
  }

  return {
    canRegister: true,
    finalStatus: 'REGISTERED',
    pdfStatusCode: mapEnrollmentStatusToPdfStatus('REGISTERED'),
    message: 'Sinh viên đáp ứng đầy đủ điều kiện đăng ký.',
    isRetake,
    isImprovement,
    checks,
  }
}

export function canCancelEnrollment(nowIso: string, settings: RuleSettings, phases?: RuleRegistrationPhase[], student?: RuleUser) {
  if (phases && phases.length > 0) {
    const simulationNow = new Date(nowIso).getTime()
    const activePhase = phases.find(p => {
      const start = new Date(p.startDate).getTime()
      const end = new Date(p.endDate).getTime()
      if (simulationNow < start || simulationNow > end) return false
      if (p.allowedCohorts && Array.isArray(p.allowedCohorts) && p.allowedCohorts.length > 0) {
        if (!student?.cohort || !p.allowedCohorts.includes(student.cohort)) return false
      }
      if (p.allowedMajors && Array.isArray(p.allowedMajors) && p.allowedMajors.length > 0) {
        if (!student?.majorCode || !p.allowedMajors.includes(student.majorCode)) return false
      }
      return true
    })
    if (activePhase) return activePhase.allowCancel
  }
  return isWithinRange(nowIso, settings.adjustmentStart, settings.adjustmentEnd)
}

export function canWithdrawEnrollment(nowIso: string, settings: RuleSettings, phases?: RuleRegistrationPhase[], student?: RuleUser) {
  if (phases && phases.length > 0) {
    const simulationNow = new Date(nowIso).getTime()
    const activePhase = phases.find(p => {
      const start = new Date(p.startDate).getTime()
      const end = new Date(p.endDate).getTime()
      if (simulationNow < start || simulationNow > end) return false
      if (p.allowedCohorts && Array.isArray(p.allowedCohorts) && p.allowedCohorts.length > 0) {
        if (!student?.cohort || !p.allowedCohorts.includes(student.cohort)) return false
      }
      if (p.allowedMajors && Array.isArray(p.allowedMajors) && p.allowedMajors.length > 0) {
        if (!student?.majorCode || !p.allowedMajors.includes(student.majorCode)) return false
      }
      return true
    })
    // For withdraw, we can assume allowCancel implies both cancel/withdraw, or fallback.
    // If phase system is fully in use, this controls it.
    if (activePhase) return activePhase.allowCancel
  }
  return (
    new Date(nowIso).getTime() > new Date(settings.adjustmentEnd).getTime() &&
    new Date(nowIso).getTime() <= new Date(settings.withdrawalDeadline).getTime()
  )
}
