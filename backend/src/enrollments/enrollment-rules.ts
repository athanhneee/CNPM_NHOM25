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
  | 'REG_ERR_CLASS_CANCELLED'
  | 'REG_ERR_ACCOUNT_INACTIVE'
  | 'REG_ERR_MAX_CLASS_PER_DAY'
  | 'REG_ERR_MAX_CLASS_PER_SEMESTER'
  | 'REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER'
  | 'REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS'

export type PdfRegistrationStatusCode = 'DK_TC' | 'HUY_DK' | 'KHONG_DU_DK' | 'NGOAI_TGDK'

export const REGISTRATION_ERROR_MESSAGES: Record<RegistrationErrorCode, string> = {
  REG_ERR_ALREADY_REGISTERED_COURSE: 'Sinh viên đã đăng ký hoặc vào danh sách chờ một lớp khác của cùng học phần trong học kỳ này.',
  REG_ERR_SECTION_NOT_OPEN: 'Lớp học phần chưa mở đăng ký.',
  REG_ERR_OUTSIDE_REGISTRATION_WINDOW: 'Ngoài thời gian đăng ký của học kỳ này.',
  REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW: 'Ngoài thời gian điều chỉnh đăng ký.',
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
  REG_ERR_CLASS_CANCELLED: 'Lớp học phần đã bị hủy.',
  REG_ERR_ACCOUNT_INACTIVE: 'Tài khoản hiện không thể thực hiện thao tác này.',
  REG_ERR_MAX_CLASS_PER_DAY: 'Vượt quá số lớp tối đa trong một ngày.',
  REG_ERR_MAX_CLASS_PER_SEMESTER: 'Vượt quá tổng số lớp tối đa trong học kỳ.',
  REG_ERR_SECTION_NOT_IN_CURRENT_SEMESTER: 'Lớp học phần không thuộc học kỳ hiện tại.',
  REG_ERR_NOT_ENOUGH_ACCUMULATED_CREDITS: 'Sinh viên chưa tích lũy đủ số tín chỉ tối thiểu yêu cầu cho môn học này.',
}

// BUG-013 FIX: Thêm cờ khóa học vụ (holds) vào RuleUser
export interface RuleUser {
  id: string
  roles: string[]
  status: string
  completedCredits?: number
  cohort?: string
  majorCode?: string
  registrationLocked?: boolean   // Cờ khóa đăng ký (nợ học phí, vi phạm, ...)
  studentStatus?: string         // Trạng thái học vụ (Đang học, Bảo lưu, Đình chỉ, Thôi học, ...)
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
  sectionCode?: string
  semesterId: string
  weekday: number
  startPeriod: number
  periodCount: number
  weeks: string
  additionalSchedules?: unknown
  makeUpSchedules?: unknown
  cancelledDates?: unknown
  startDate?: string | null  // BUG-012 FIX: date range support
  endDate?: string | null    // BUG-012 FIX: date range support
  capacity: number
  minCapacity: number
  registeredCount: number
  allowWaitlist: boolean
  status: string
}

export interface ScheduleConflictDetail {
  conflictSectionId: string
  conflictSectionCode: string
  weekday: number
  candidatePeriods: string
  conflictPeriods: string
  overlappingWeeks: number[]
}

// ── BUG-012 FIX: Occurrence-based schedule conflict engine ──

/** A concrete occurrence: one specific date + period range */
interface ScheduleOccurrence {
  dateStr: string       // YYYY-MM-DD
  weekday: number       // 2-8 (VN convention)
  startPeriod: number
  periodCount: number
}

/** Fallback entry when dates are not available */
interface FallbackSchedule {
  weekday: number
  startPeriod: number
  periodCount: number
  weekIndex?: number
}

/** Convert JS Date.getDay() (0=Sun) to VN weekday (2=Mon..8=Sun) */
function jsToVnWeekday(jsDay: number): number {
  return jsDay === 0 ? 8 : jsDay + 1
}

/** Format date as YYYY-MM-DD */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Generate all dates between start and end (inclusive) matching a VN weekday */
function generateWeeklyDates(
  startDate: string,
  endDate: string,
  vnWeekday: number,
): string[] {
  const result: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  // VN weekday to JS day: 2->1, 3->2, ..., 7->6, 8->0
  const jsDay = vnWeekday === 8 ? 0 : vnWeekday - 1

  const cursor = new Date(start)
  // Move cursor to the first matching day
  while (cursor.getDay() !== jsDay && cursor <= end) {
    cursor.setDate(cursor.getDate() + 1)
  }
  while (cursor <= end) {
    result.push(toDateStr(cursor))
    cursor.setDate(cursor.getDate() + 7)
  }
  return result
}

/**
 * Expand a section's schedules into concrete occurrences.
 * If startDate/endDate are available, produces exact date occurrences.
 * Otherwise falls back to weekday+weekIndex matching.
 */
function expandToOccurrences(
  section: RuleSection,
  semesterStartDate?: string,
): { occurrences: ScheduleOccurrence[]; fallbacks: FallbackSchedule[] } {
  const occurrences: ScheduleOccurrence[] = []
  const fallbacks: FallbackSchedule[] = []
  const cancelledSet = new Set(
    Array.isArray(section.cancelledDates)
      ? (section.cancelledDates as string[])
      : [],
  )

  const sectionStart = section.startDate || semesterStartDate
  const sectionEnd = section.endDate
  const hasDates = Boolean(sectionStart && sectionEnd)

  // Helper: add weekly schedule entries
  const addWeekly = (weekday: number, startPeriod: number, periodCount: number, weeksStr: string) => {
    if (hasDates) {
      const allDates = generateWeeklyDates(sectionStart!, sectionEnd!, weekday)
      const activeWeeks = parseWeeks(weeksStr)

      for (const dateStr of allDates) {
        // If weeks are specified, filter by week index
        if (activeWeeks.size > 0) {
          const daysSinceStart = Math.floor(
            (new Date(dateStr).getTime() - new Date(sectionStart!).getTime()) / (1000 * 60 * 60 * 24),
          )
          const weekIdx = Math.floor(daysSinceStart / 7) + 1
          if (!activeWeeks.has(weekIdx)) continue
        }

        // Skip cancelled dates
        if (cancelledSet.has(dateStr)) continue

        occurrences.push({ dateStr, weekday, startPeriod, periodCount })
      }
    } else {
      // Fallback: no dates, use week index matching
      const activeWeeks = Array.from(parseWeeks(weeksStr))
      if (activeWeeks.length === 0) {
        fallbacks.push({ weekday, startPeriod, periodCount })
      } else {
        for (const weekIdx of activeWeeks) {
          fallbacks.push({ weekday, startPeriod, periodCount, weekIndex: weekIdx })
        }
      }
    }
  }

  // 1. Primary schedule
  addWeekly(section.weekday, section.startPeriod, section.periodCount, section.weeks)

  // 2. Additional schedules
  if (Array.isArray(section.additionalSchedules)) {
    for (const sch of section.additionalSchedules as any[]) {
      if (typeof sch.weekday === 'number' && typeof sch.startPeriod === 'number' && typeof sch.periodCount === 'number') {
        addWeekly(sch.weekday, sch.startPeriod, sch.periodCount, sch.weeks || '')
      }
    }
  }

  // 3. Makeup schedules (always exact dates)
  if (Array.isArray(section.makeUpSchedules)) {
    for (const mk of section.makeUpSchedules as any[]) {
      if (mk.date && typeof mk.startPeriod === 'number' && typeof mk.periodCount === 'number') {
        const dateStr = typeof mk.date === 'string' ? mk.date : toDateStr(new Date(mk.date))
        // Skip if this makeup date is also in cancelled list
        if (cancelledSet.has(dateStr)) continue
        const d = new Date(dateStr)
        const weekday = jsToVnWeekday(d.getDay())
        occurrences.push({ dateStr, weekday, startPeriod: mk.startPeriod, periodCount: mk.periodCount })
      }
    }
  }

  return { occurrences, fallbacks }
}

function checkPeriodOverlap(start1: number, count1: number, start2: number, count2: number) {
  return start1 < start2 + count2 && start2 < start1 + count1
}

export function checkScheduleConflict(
  candidate: RuleSection,
  comparedSections: RuleSection[],
  semesterStartDate?: string,
): ScheduleConflictDetail | null {
  const candidateExpanded = expandToOccurrences(candidate, semesterStartDate)

  for (const section of comparedSections) {
    const sectionExpanded = expandToOccurrences(section, semesterStartDate)

    let conflictWeekday = 0
    let conflictCandidatePeriods = ''
    let conflictPeriods = ''
    const overlappingWeeks: number[] = []
    let hasConflict = false

    // ── Date-based comparison (most accurate) ──
    for (const cOcc of candidateExpanded.occurrences) {
      for (const sOcc of sectionExpanded.occurrences) {
        if (cOcc.dateStr !== sOcc.dateStr) continue
        if (!checkPeriodOverlap(cOcc.startPeriod, cOcc.periodCount, sOcc.startPeriod, sOcc.periodCount)) continue

        hasConflict = true
        conflictWeekday = cOcc.weekday
        conflictCandidatePeriods = `${cOcc.startPeriod}-${cOcc.startPeriod + cOcc.periodCount - 1}`
        conflictPeriods = `${sOcc.startPeriod}-${sOcc.startPeriod + sOcc.periodCount - 1}`
        break
      }
      if (hasConflict) break
    }

    // ── Cross: candidate occurrence vs section fallback ──
    if (!hasConflict) {
      for (const cOcc of candidateExpanded.occurrences) {
        for (const sFb of sectionExpanded.fallbacks) {
          if (cOcc.weekday !== sFb.weekday) continue
          if (!checkPeriodOverlap(cOcc.startPeriod, cOcc.periodCount, sFb.startPeriod, sFb.periodCount)) continue
          hasConflict = true
          conflictWeekday = cOcc.weekday
          conflictCandidatePeriods = `${cOcc.startPeriod}-${cOcc.startPeriod + cOcc.periodCount - 1}`
          conflictPeriods = `${sFb.startPeriod}-${sFb.startPeriod + sFb.periodCount - 1}`
          break
        }
        if (hasConflict) break
      }
    }

    // ── Cross: candidate fallback vs section occurrence ──
    if (!hasConflict) {
      for (const cFb of candidateExpanded.fallbacks) {
        for (const sOcc of sectionExpanded.occurrences) {
          if (cFb.weekday !== sOcc.weekday) continue
          if (!checkPeriodOverlap(cFb.startPeriod, cFb.periodCount, sOcc.startPeriod, sOcc.periodCount)) continue
          hasConflict = true
          conflictWeekday = cFb.weekday
          conflictCandidatePeriods = `${cFb.startPeriod}-${cFb.startPeriod + cFb.periodCount - 1}`
          conflictPeriods = `${sOcc.startPeriod}-${sOcc.startPeriod + sOcc.periodCount - 1}`
          break
        }
        if (hasConflict) break
      }
    }

    // ── Fallback-only comparison (old behavior, when no dates available) ──
    if (!hasConflict) {
      for (const cFb of candidateExpanded.fallbacks) {
        for (const sFb of sectionExpanded.fallbacks) {
          if (cFb.weekday !== sFb.weekday) continue
          if (!checkPeriodOverlap(cFb.startPeriod, cFb.periodCount, sFb.startPeriod, sFb.periodCount)) continue

          if (cFb.weekIndex !== undefined && sFb.weekIndex !== undefined) {
            if (cFb.weekIndex === sFb.weekIndex) {
              if (!overlappingWeeks.includes(cFb.weekIndex)) {
                overlappingWeeks.push(cFb.weekIndex)
              }
              conflictWeekday = cFb.weekday
              conflictCandidatePeriods = `${cFb.startPeriod}-${cFb.startPeriod + cFb.periodCount - 1}`
              conflictPeriods = `${sFb.startPeriod}-${sFb.startPeriod + sFb.periodCount - 1}`
            }
          } else {
            // One or both have no week info → generic overlap
            hasConflict = true
            conflictWeekday = cFb.weekday
            conflictCandidatePeriods = `${cFb.startPeriod}-${cFb.startPeriod + cFb.periodCount - 1}`
            conflictPeriods = `${sFb.startPeriod}-${sFb.startPeriod + sFb.periodCount - 1}`
            break
          }
        }
        if (hasConflict) break
      }
    }

    if (hasConflict || overlappingWeeks.length > 0) {
      overlappingWeeks.sort((a, b) => a - b)
      return {
        conflictSectionId: section.id,
        conflictSectionCode: section.sectionCode ?? section.courseCode,
        weekday: conflictWeekday,
        candidatePeriods: conflictCandidatePeriods,
        conflictPeriods,
        overlappingWeeks,
      }
    }
  }

  return null
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
  allowWithdraw: boolean
}

export interface RuleSettings {
  simulationNow: string
  registrationStart: string
  registrationEnd: string
  adjustmentStart: string
  adjustmentEnd: string
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

// BUG-011 FIX: Enrollment status 'COMPLETED' không được coi là đã đậu.
// Việc kiểm tra tiên quyết chỉ dựa trên StudentResult.passed = true.
const HISTORY_PASS_STATUSES = new Set<EnrollmentStatus>([])
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

  // BUG-013 FIX: Danh sách trạng thái học vụ được phép đăng ký
  const ALLOWED_STUDENT_STATUSES = new Set([
    'Đang học',
    'DANG_HOC',
    'ACTIVE',
    'STUDYING',
    undefined, // cho phép nếu chưa có studentStatus (backward compat)
    null,
    '',
  ])

  // BUG-013 FIX: Trạng thái bị cấm và message tương ứng
  const BLOCKED_STATUS_MESSAGES: Record<string, string> = {
    'Bảo lưu': 'Sinh viên đang bảo lưu, không thể đăng ký.',
    'BAO_LUU': 'Sinh viên đang bảo lưu, không thể đăng ký.',
    'DEFERRED': 'Sinh viên đang bảo lưu, không thể đăng ký.',
    'Đình chỉ': 'Sinh viên bị đình chỉ, không thể đăng ký.',
    'DINH_CHI': 'Sinh viên bị đình chỉ, không thể đăng ký.',
    'SUSPENDED': 'Sinh viên bị đình chỉ, không thể đăng ký.',
    'Thôi học': 'Sinh viên đã thôi học, không thể đăng ký.',
    'THOI_HOC': 'Sinh viên đã thôi học, không thể đăng ký.',
    'WITHDRAWN': 'Sinh viên đã thôi học, không thể đăng ký.',
    'Tốt nghiệp': 'Sinh viên đã tốt nghiệp, không thể đăng ký.',
    'TOT_NGHIEP': 'Sinh viên đã tốt nghiệp, không thể đăng ký.',
    'GRADUATED': 'Sinh viên đã tốt nghiệp, không thể đăng ký.',
  }

  const studentStatusAllowed = ALLOWED_STUDENT_STATUSES.has(student?.studentStatus as any)
  const blockedMessage = student?.studentStatus
    ? BLOCKED_STATUS_MESSAGES[student.studentStatus] ?? `Trạng thái học vụ "${student.studentStatus}" không được phép đăng ký.`
    : 'Không xác định trạng thái học vụ.'

  const checks = [
    buildRuleResult(
      'account',
      'Tài khoản hợp lệ',
      Boolean(student?.roles.includes('STUDENT') && student.status === 'ACTIVE'),
      'Tài khoản sinh viên đang hoạt động.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ACCOUNT_INACTIVE,
      student ? 'REG_ERR_ACCOUNT_INACTIVE' : 'REG_ERR_STUDENT_NOT_FOUND',
    ),
    // BUG-013 FIX: Kiểm tra cờ khóa đăng ký (nợ học phí, vi phạm, etc.)
    buildRuleResult(
      'registration-lock',
      'Không bị khóa đăng ký',
      Boolean(student && !student.registrationLocked),
      'Tài khoản chưa bị khóa đăng ký.',
      'Tài khoản bị khóa đăng ký (có thể do nợ học phí hoặc vi phạm). Vui lòng liên hệ Phòng Đào tạo.',
      'REG_ERR_REGISTRATION_LOCKED' as any,
    ),
    // BUG-013 FIX: Kiểm tra trạng thái học vụ (bảo lưu, đình chỉ, thôi học)
    buildRuleResult(
      'student-status',
      'Trạng thái học vụ hợp lệ',
      studentStatusAllowed,
      'Trạng thái học vụ cho phép đăng ký.',
      blockedMessage,
      'REG_ERR_STUDENT_STATUS_BLOCKED' as any,
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
      // BUG-008 FIX: ignoreCapacity chỉ bypass sĩ số, KHÔNG bypass trạng thái lớp.
      // Lớp CANCELLED/COMPLETED/CLOSED/IN_PROGRESS không được phép đăng ký dù force=true.
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
      'Trùng học phần trong học kỳ',
      Boolean(section && !hasDuplicateCourse),
      'Chưa có lớp khác của cùng học phần trong học kỳ này.',
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
        const weekdayNames = ['', '', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
        const dayName = weekdayNames[conflict.weekday] ?? `Thứ ${conflict.weekday}`
        const weeksInfo = conflict.overlappingWeeks.length > 0
          ? `, tuần ${conflict.overlappingWeeks.join(', ')}`
          : ''
        failMessage = `Trùng lịch với lớp ${conflict.conflictSectionCode}: ${dayName}, tiết ${conflict.conflictPeriods}${weeksInfo}.`
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
  return isWithinRange(nowIso, settings.registrationStart, settings.registrationEnd)
    || isWithinRange(nowIso, settings.adjustmentStart, settings.adjustmentEnd)
}


