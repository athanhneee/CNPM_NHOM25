import type { User } from '@/types/user'
import type { Course } from '@/types/course'
import type { EligibilityCheckResult, Enrollment } from '@/types/enrollment'
import type { Section } from '@/types/section'
import type { SystemSettings } from '@/types/settings'
import { REGISTRATION_ERROR_MESSAGES, type RegistrationErrorCode } from '@/lib/error-codes'
import { isWithinRange } from '@/lib/date'
import { mapEnrollmentStatusToPdfStatus, mapRegistrationErrorToPdfStatus } from '@/lib/status-conventions'

const HISTORY_PASS_STATUSES = new Set(['COMPLETED'])
const HISTORY_RESULT_STATUSES = new Set(['COMPLETED', 'FAILED'])
const ACTIVE_ENROLLMENT_STATUSES = new Set(['REGISTERED', 'WAITLISTED'])

interface EligibilityContext {
  nowIso: string
  student: User | undefined
  section: Section | undefined
  targetCourse: Course | undefined
  courses: Course[]
  sections: Section[]
  enrollments: Enrollment[]
  settings: SystemSettings
}

interface RuleResult {
  passed: boolean
  key: string
  label: string
  message: string
  errorCode?: RegistrationErrorCode | undefined
}

function buildRuleResult(
  key: string,
  label: string,
  passed: boolean,
  successMessage: string,
  failureMessage: string,
  errorCode?: RegistrationErrorCode,
): RuleResult {
  return {
    key,
    label,
    passed,
    message: passed ? successMessage : failureMessage,
    ...(errorCode ? { errorCode } : {}),
  }
}

export function calculateCurrentCredits(
  studentId: string,
  semesterId: string,
  enrollments: Enrollment[],
  sections: Section[],
  courses: Course[],
  settings?: SystemSettings,
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

export function checkScheduleConflict(candidate: Section, comparedSections: Section[]) {
  return comparedSections.some((section) => {
    const sameDay = section.weekday === candidate.weekday
    if (!sameDay) {
      return false
    }

    const candidateEnd = candidate.startPeriod + candidate.periodCount
    const sectionEnd = section.startPeriod + section.periodCount
    return candidate.startPeriod < sectionEnd && section.startPeriod < candidateEnd
  })
}

export function evaluateEnrollmentEligibility(
  context: EligibilityContext,
): EligibilityCheckResult {
  const { nowIso, student, section, targetCourse, courses, sections, enrollments, settings } = context

  const studentEnrollments = enrollments.filter((item) => item.studentId === student?.id)
  const currentSemesterEnrollments = studentEnrollments.filter(
    (item) => item.semesterId === settings.currentSemesterId,
  )

  const currentSections = currentSemesterEnrollments
    .filter((item) => ACTIVE_ENROLLMENT_STATUSES.has(item.status))
    .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId))
    .filter((item): item is Section => Boolean(item))

  const completedCourseCodes = new Set(
    studentEnrollments
      .filter((item) => HISTORY_PASS_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  )

  const completedOrAttemptedCourseCodes = new Set(
    studentEnrollments
      .filter((item) => HISTORY_RESULT_STATUSES.has(item.status))
      .map((item) => sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode)
      .filter((item): item is string => Boolean(item)),
  )

  const currentSemesterCourseCodes = new Set(
    currentSections.map((item) => item.courseCode),
  )

  const isImprovement = Boolean(targetCourse && completedCourseCodes.has(targetCourse.code))
  const failedCount = studentEnrollments.filter(
    (item) =>
      item.status === 'FAILED' &&
      sections.find((sectionItem) => sectionItem.id === item.sectionId)?.courseCode === targetCourse?.code,
  ).length
  const isRetake = Boolean(targetCourse && failedCount > 0)

  const checks: RuleResult[] = [
    buildRuleResult(
      'account',
      'Tài khoản hợp lệ',
      Boolean(student?.roles.includes('STUDENT') && student.status === 'ACTIVE'),
      'Tài khoản sinh viên đang hoạt động.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ACCOUNT_INACTIVE,
      'REG_ERR_ACCOUNT_INACTIVE',
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
      'section-status',
      'Trạng thái lớp',
      Boolean(section && (section.status === 'OPEN' || section.status === 'FULL')),
      'Lớp học phần đang mở đăng ký hoặc cho phép xét danh sách chờ.',
      section?.status === 'CANCELLED'
        ? REGISTRATION_ERROR_MESSAGES.REG_ERR_CLASS_CANCELLED
        : REGISTRATION_ERROR_MESSAGES.REG_ERR_SECTION_NOT_OPEN,
      section?.status === 'CANCELLED' ? 'REG_ERR_CLASS_CANCELLED' : 'REG_ERR_SECTION_NOT_OPEN',
    ),
    buildRuleResult(
      'registration-window',
      'Cửa sổ đăng ký',
      isWithinRange(nowIso, settings.registrationStart, settings.registrationEnd),
      'Hệ thống đang nằm trong cửa sổ đăng ký.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_OUTSIDE_REGISTRATION_WINDOW,
      'REG_ERR_OUTSIDE_REGISTRATION_WINDOW',
    ),
    buildRuleResult(
      'duplicate',
      'Trùng lặp đăng ký',
      Boolean(
        section &&
          !currentSemesterEnrollments.some(
            (item) =>
              item.sectionId === section.id &&
              ['REGISTERED', 'WAITLISTED', 'PENDING'].includes(item.status),
          ),
      ),
      'Chưa có yêu cầu đăng ký trùng lặp.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_ALREADY_REGISTERED,
      'REG_ERR_ALREADY_REGISTERED',
    ),
    buildRuleResult(
      'duplicate-course',
      'Trùng học phần trong học kỳ',
      Boolean(
        section &&
          !currentSemesterEnrollments.some(
            (item) =>
              item.sectionId !== section.id &&
              ['REGISTERED', 'WAITLISTED', 'PENDING'].includes(item.status) &&
              sections.find((s) => s.id === item.sectionId)?.courseCode === targetCourse?.code
          ),
      ),
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
      'prerequisite',
      'Điều kiện tiên quyết',
      Boolean(
        targetCourse?.prerequisites.every((code) => completedCourseCodes.has(code)) ?? false,
      ),
      'Sinh viên đáp ứng tất cả môn tiên quyết.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_PREREQUISITE_NOT_MET,
      'REG_ERR_PREREQUISITE_NOT_MET',
    ),
    buildRuleResult(
      'prestudy',
      'Điều kiện học trước',
      Boolean(
        targetCourse?.prestudy.every((code) => completedOrAttemptedCourseCodes.has(code)) ?? false,
      ),
      'Sinh viên đã có kết quả cho tất cả môn học trước.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_PRESTUDY_NOT_MET,
      'REG_ERR_PRESTUDY_NOT_MET',
    ),
    buildRuleResult(
      'corequisite',
      'Điều kiện song hành',
      Boolean(
        targetCourse?.corequisites.every(
          (code) => completedCourseCodes.has(code) || currentSemesterCourseCodes.has(code),
        ) ?? false,
      ),
      'Môn song hành đã được hoàn thành hoặc đang đăng ký cùng kỳ.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_COREQUISITE_NOT_MET,
      'REG_ERR_COREQUISITE_NOT_MET',
    ),
    buildRuleResult(
      'schedule-conflict',
      'Trùng lịch học',
      Boolean(section && !checkScheduleConflict(section, currentSections)),
      'Không phát hiện xung đột thời khóa biểu.',
      REGISTRATION_ERROR_MESSAGES.REG_ERR_SCHEDULE_CONFLICT,
      'REG_ERR_SCHEDULE_CONFLICT',
    ),
    buildRuleResult(
      'credit-limit',
      'Giới hạn tín chỉ',
      Boolean(
        section &&
          targetCourse &&
          calculateCurrentCredits(student?.id ?? '', settings.currentSemesterId, enrollments, sections, courses, settings) +
            targetCourse.credits <=
            (settings.semesterType === 'SUMMER' ? settings.maxCreditsSummer : settings.maxCreditsMain),
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
      pdfStatusCode: mapRegistrationErrorToPdfStatus(firstFailedCheck.errorCode),
      ...(firstFailedCheck.errorCode ? { errorCode: firstFailedCheck.errorCode } : {}),
    }
  }

  if (!section || !targetCourse) {
    return {
      canRegister: false,
      finalStatus: null,
      pdfStatusCode: 'KHONG_DU_DK',
      errorCode: 'REG_ERR_CLASS_NOT_FOUND',
      message: REGISTRATION_ERROR_MESSAGES.REG_ERR_CLASS_NOT_FOUND,
      isRetake,
      isImprovement,
      checks,
    }
  }

  const isFull = section.registeredCount >= section.capacity || section.status === 'FULL'

  if (isFull && section.allowWaitlist && settings.allowWaitlist) {
    return {
      canRegister: true,
      finalStatus: 'WAITLISTED',
      pdfStatusCode: mapEnrollmentStatusToPdfStatus('WAITLISTED'),
      message: 'Lớp đã full, sinh viên sẽ được đưa vào danh sách chờ.',
      isRetake,
      isImprovement,
      checks,
    }
  }

  if (isFull) {
    return {
      canRegister: false,
      finalStatus: null,
      pdfStatusCode: 'KHONG_DU_DK',
      errorCode: 'REG_ERR_FULL_CAPACITY',
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

export function canCancelEnrollment(nowIso: string, settings: SystemSettings) {
  return isWithinRange(nowIso, settings.adjustmentStart, settings.adjustmentEnd)
}
