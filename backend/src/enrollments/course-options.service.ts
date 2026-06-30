import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { UserRole } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { normalizeRoles } from '../common/utils/public-user'
import { parsePagination } from '../common/utils/pagination'
import { CourseOptionsMode, CourseOptionsQueryDto } from './dto/course-options.dto'
import { isCourseAllowedForClass, getDepartmentFromClass, getAdmissionYearFromClass } from './class-course-mapping.util'
import {
  evaluateEnrollmentEligibility,
  EligibilityContext,
  RuleCourse,
  RuleEnrollment,
  RuleSection,
  RuleSettings,
  RuleStudentResult,
  RuleCourseCondition,
  RuleUser,
  EnrollmentStatus as RuleEnrollmentStatus,
} from './enrollment-rules'

// ── Types ────────────────────────────────────────────────────────────

type AcademicStatus = 'NOT_STUDIED' | 'PASSED' | 'FAILED' | 'IN_PROGRESS' | 'REGISTERED'

type RegistrationStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'FULL'
  | 'CANCELLED'
  | 'WAITLIST'
  | 'REGISTERED'
  | 'PENDING'
  | 'UPCOMING'
  | 'LOCKED'

interface IneligibleReason {
  code: string
  message: string
}

interface ScheduleInfo {
  weekday: number
  startPeriod: number
  periodCount: number
  room: string
  weeks: string
}

interface SectionOption {
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

interface CourseOption {
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

export interface CourseOptionsResponse {
  mode: CourseOptionsMode
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

// ── Constants ────────────────────────────────────────────────────────

const ACTIVE_ENROLLMENT_STATUSES = ['REGISTERED', 'WAITLISTED', 'PENDING']

// ── Service ──────────────────────────────────────────────────────────

@Injectable()
export class CourseOptionsService {
  constructor(private prisma: PrismaService) {}

  async getCourseOptions(
    userId: string,
    userRoles: string[],
    query: CourseOptionsQueryDto,
  ): Promise<CourseOptionsResponse> {
    // 1. Resolve student ID with authorization
    const studentId = this.resolveStudentId(userId, userRoles, query.studentId)

    return this.prisma.$transaction(async (tx) => {
      // 2. Load system settings
      const settings = await tx.systemSetting.findUnique({ where: { id: 1 } })
      if (!settings) {
        throw new BadRequestException('Chưa cấu hình tham số hệ thống.')
      }

      const termId = query.termId ?? settings.currentSemesterId

      // 3. Load student
      const student = await tx.user.findUnique({ where: { id: studentId } })
      if (!student || !normalizeRoles(student.roles).includes(UserRole.STUDENT)) {
        throw new BadRequestException('Không tìm thấy thông tin sinh viên.')
      }

      // 4. Load term
      const semester = await tx.semesterOption.findUnique({
        where: { id: termId },
        include: { phases: true },
      })
      if (!semester) {
        throw new BadRequestException('Không tìm thấy học kỳ.')
      }

      // 5. Preload all needed data in batch (avoid N+1)
      const [
        allCoursesRaw,
        semesterSections,
        studentEnrollments,
        studentResults,
        courseConditions,
      ] = await Promise.all([
        tx.course.findMany({ where: { status: 'ACTIVE' } }),
        tx.section.findMany({
          where: { semesterId: termId, status: { notIn: ['CANCELLED'] } },
          include: { lecturer: { select: { id: true, fullName: true } } },
        }),
        tx.enrollment.findMany({ where: { studentId } }),
        tx.studentResult.findMany({ where: { studentId } }),
        tx.courseCondition.findMany(),
      ])

      // Build lookup maps
      const courseMap = new Map(allCoursesRaw.map((c) => [c.code, c]))
      const sectionsByCourse = new Map<string, typeof semesterSections>()
      for (const sec of semesterSections) {
        const list = sectionsByCourse.get(sec.courseCode) ?? []
        list.push(sec)
        sectionsByCourse.set(sec.courseCode, list)
      }

      // Academic status helpers
      const passedCodes = new Set<string>()
      const failedCodes = new Set<string>()
      const failedDetails = new Map<string, { count: number; lastGrade: string | null; lastSemester: string | null }>()

      for (const r of studentResults) {
        if (r.passed) {
          passedCodes.add(r.courseCode)
        } else if (r.status === 'FAILED') {
          failedCodes.add(r.courseCode)
          const existing = failedDetails.get(r.courseCode)
          const count = (existing?.count ?? 0) + 1
          failedDetails.set(r.courseCode, {
            count,
            lastGrade: r.letterGrade ?? existing?.lastGrade ?? null,
            lastSemester: r.semesterId ?? existing?.lastSemester ?? null,
          })
        }
      }
      // Remove from failed if also passed
      for (const code of passedCodes) {
        failedCodes.delete(code)
      }

      const activeEnrollmentCourses = new Set<string>()
      const registeredSectionIds = new Set<string>()
      for (const e of studentEnrollments) {
        if (ACTIVE_ENROLLMENT_STATUSES.includes(e.status)) {
          registeredSectionIds.add(e.sectionId)
          const sec = semesterSections.find((s) => s.id === e.sectionId)
          if (sec && e.semesterId === termId) {
            activeEnrollmentCourses.add(sec.courseCode)
          }
        }
      }

      // Ongoing (IN_PROGRESS results)
      const ongoingCodes = new Set<string>()
      for (const r of studentResults) {
        if (r.status === 'IN_PROGRESS') ongoingCodes.add(r.courseCode)
      }
      for (const code of activeEnrollmentCourses) {
        ongoingCodes.add(code)
      }

      // 6. Compute student semester index
      const studentClassCode = student?.studentClass ?? query.studentClassCode
      const studentSemesterIndex = this.computeSemesterIndex(student.cohort, studentClassCode, semester)

      // 7. Filter courses based on mode
      let targetCourseCodes: string[]

      switch (query.mode) {
        case CourseOptionsMode.BY_COURSE:
          targetCourseCodes = this.filterByCourse(query, allCoursesRaw, sectionsByCourse)
          break
        case CourseOptionsMode.OPEN_FOR_STUDENT_CLASS:
          targetCourseCodes = this.filterOpenForClass(
            student,
            allCoursesRaw,
            sectionsByCourse,
            semester,
          )
          break
        case CourseOptionsMode.CURRICULUM_PLAN:
          targetCourseCodes = this.filterCurriculumPlan(
            studentSemesterIndex,
            studentClassCode,
            allCoursesRaw,
            sectionsByCourse,
          )
          break
        case CourseOptionsMode.NOT_STUDIED_IN_CURRICULUM:
          targetCourseCodes = this.filterNotStudied(
            studentSemesterIndex,
            studentClassCode,
            allCoursesRaw,
            sectionsByCourse,
            passedCodes,
            ongoingCodes,
            failedCodes,
            activeEnrollmentCourses,
          )
          break
        case CourseOptionsMode.FAILED_COURSES:
          targetCourseCodes = this.filterFailedCourses(
            failedCodes,
            sectionsByCourse,
          )
          break
        case CourseOptionsMode.BY_DEPARTMENT:
          targetCourseCodes = this.filterByDepartment(query, allCoursesRaw, sectionsByCourse)
          break
        case CourseOptionsMode.BY_SECTION:
          targetCourseCodes = this.filterBySection(query, semesterSections, allCoursesRaw)
          break
        default:
          throw new BadRequestException(`Chế độ lọc không hợp lệ: ${query.mode}`)
      }

      // 8. Build eligibility context (shared across all sections)
      const ruleSettings = this.asRuleSettings(settings, (semester.type as 'MAIN' | 'SUMMER') ?? 'MAIN')
      const ruleStudent: RuleUser = {
        id: student.id,
        roles: normalizeRoles(student.roles),
        status: student.status,
        completedCredits: student.completedCredits ?? 0,
        cohort: student.cohort ?? undefined,
        majorCode: student.majorCode ?? undefined,
        registrationLocked: student.registrationLocked ?? false,
        studentStatus: student.studentStatus ?? undefined,
      }
      const ruleCourses: RuleCourse[] = allCoursesRaw.map((c) => ({
        code: c.code,
        credits: c.credits,
        requiredAccumulatedCredits: c.requiredAccumulatedCredits,
        prerequisites: c.prerequisites,
        prestudy: c.prestudy,
        corequisites: c.corequisites,
      }))
      const allSectionsRule: RuleSection[] = semesterSections.map((s) => this.asRuleSection(s))
      const ruleEnrollments: RuleEnrollment[] = studentEnrollments.map((e) => ({
        id: e.id,
        studentId: e.studentId,
        sectionId: e.sectionId,
        semesterId: e.semesterId,
        status: e.status as RuleEnrollmentStatus,
      }))
      const ruleConditions: RuleCourseCondition[] = courseConditions.map((c) => ({
        courseCode: c.courseCode,
        requiredCourseCode: c.requiredCourseCode,
        type: c.type,
      }))
      const ruleResults: RuleStudentResult[] = studentResults.map((r) => ({
        studentId: r.studentId,
        courseCode: r.courseCode,
        status: r.status,
        passed: r.passed,
      }))
      const rulePhases = (semester as any).phases?.map((p: any) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        allowedCohorts: p.allowedCohorts,
        allowedMajors: p.allowedMajors,
        maxCredits: p.maxCredits,
        allowRegister: p.allowRegister,
        allowCancel: p.allowCancel,
        allowWithdraw: p.allowWithdraw ?? false,
      }))

      // 9. Build course options with eligibility per section
      const courseOptions: CourseOption[] = []

      for (const courseCode of targetCourseCodes) {
        const course = courseMap.get(courseCode)
        if (!course) continue

        const sections = sectionsByCourse.get(courseCode) ?? []
        if (sections.length === 0) continue

        // Determine academic status
        const academicStatus = this.getAcademicStatus(
          courseCode,
          passedCodes,
          failedCodes,
          ongoingCodes,
          activeEnrollmentCourses,
        )

        const sectionOptions: SectionOption[] = []

        for (const sec of sections) {
          // Check if student has active enrollment for this section
          const studentEnrollment = studentEnrollments.find(
            (e) =>
              e.sectionId === sec.id &&
              e.semesterId === termId &&
              ACTIVE_ENROLLMENT_STATUSES.includes(e.status),
          )

          // Run eligibility check
          const ruleCourse: RuleCourse = {
            code: course.code,
            credits: course.credits,
            requiredAccumulatedCredits: course.requiredAccumulatedCredits,
            prerequisites: course.prerequisites,
            prestudy: course.prestudy,
            corequisites: course.corequisites,
          }

          const context: EligibilityContext = {
            student: ruleStudent,
            section: this.asRuleSection(sec),
            targetCourse: ruleCourse,
            courses: ruleCourses,
            sections: allSectionsRule,
            enrollments: ruleEnrollments,
            courseConditions: ruleConditions,
            studentResults: ruleResults,
            settings: ruleSettings,
            phases: rulePhases,
            semesterStartDate: semester.startDate?.toISOString(),
          }

          const eligibility = evaluateEnrollmentEligibility(context)

          // Compute registration status
          let regStatus = this.computeRegistrationStatus(
            sec,
            semester,
            settings,
            studentEnrollment,
          )

          if (academicStatus === 'PASSED' && !studentEnrollment) {
            regStatus = 'COMPLETED' as RegistrationStatus
          }

          // Collect ineligible reasons from failed checks
          const ineligibleReasons: IneligibleReason[] = []
          for (const check of eligibility.checks) {
            if (!check.passed) {
              ineligibleReasons.push({
                code: (check as any).errorCode ?? check.key,
                message: check.message,
              })
            }
          }

          // Also add capacity check
          if (!eligibility.canRegister && eligibility.errorCode === 'REG_ERR_FULL_CAPACITY') {
            if (!ineligibleReasons.some((r) => r.code === 'REG_ERR_FULL_CAPACITY')) {
              ineligibleReasons.push({
                code: 'REG_ERR_FULL_CAPACITY',
                message: 'Lớp học phần đã đủ sĩ số tối đa.',
              })
            }
          }

          sectionOptions.push({
            sectionId: sec.id,
            sectionCode: sec.sectionCode,
            lecturer: sec.lecturer?.fullName ?? sec.guestLecturer ?? null,
            capacity: sec.capacity,
            enrolled: sec.registeredCount,
            remainingSeats: Math.max(0, sec.capacity - sec.registeredCount),
            registrationStatus: regStatus,
            eligible: eligibility.canRegister,
            ineligibleReasons,
            schedules: [
              {
                weekday: sec.weekday,
                startPeriod: sec.startPeriod,
                periodCount: sec.periodCount,
                room: sec.room,
                weeks: sec.weeks,
              },
            ],
          })
        }

        const courseOption: CourseOption = {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          credits: course.credits,
          department: course.department,
          faculty: course.faculty ?? null,
          category: course.category,
          suggestedSemester: course.suggestedSemester ?? null,
          academicStatus,
          sections: sectionOptions,
        }

        if (academicStatus === 'FAILED') {
          const details = failedDetails.get(courseCode)
          courseOption.retakeInfo = details
            ? { attemptCount: details.count, lastGrade: details.lastGrade, lastSemester: details.lastSemester }
            : { attemptCount: 0, lastGrade: null, lastSemester: null }
        }

        courseOptions.push(courseOption)
      }

      // 10. Pagination
      const { page, limit } = parsePagination(query)
      const total = courseOptions.length
      const paginatedCourses =
        query.page || query.limit
          ? courseOptions.slice((page - 1) * limit, page * limit)
          : courseOptions

      return {
        mode: query.mode,
        student: {
          id: student.id,
          studentCode: student.code ?? student.username,
          fullName: student.fullName,
          studentClass: student.studentClass ? { code: student.studentClass } : null,
          curriculum: student.majorName
            ? { name: student.majorName }
            : student.program
              ? { name: student.program }
              : null,
        },
        term: {
          id: semester.id,
          name: semester.label,
        },
        courses: paginatedCourses,
        ...(query.page || query.limit
          ? {
              pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
              },
            }
          : {}),
      }
    })
  }

  // ── Private helpers ────────────────────────────────────────────────

  private resolveStudentId(userId: string, roles: string[], requestedStudentId?: string): string {
    const isPrivileged = roles.some((r) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(r))

    if (isPrivileged) {
      if (!requestedStudentId) {
        throw new BadRequestException('studentId is required when acting on behalf of a student.')
      }
      return requestedStudentId
    }

    if (roles.includes('STUDENT')) {
      if (requestedStudentId && requestedStudentId !== userId) {
        throw new ForbiddenException('Students can only access their own data.')
      }
      return userId
    }

    throw new ForbiddenException('You do not have permission to access course options.')
  }

  private computeSemesterIndex(cohort: string | null | undefined, studentClass: string | null | undefined, semester: any): number {
    let admissionYear: number | null = null

    if (cohort) {
      const yearMatch = cohort.match(/(\d{4})/)
      if (yearMatch) admissionYear = Number(yearMatch[1])
      else {
        const twoDigit = cohort.match(/(\d{2})/)
        if (twoDigit) admissionYear = 2000 + Number(twoDigit[1])
      }
    }

    // Fallback to studentClass if cohort year not found
    if (!admissionYear && studentClass) {
      admissionYear = getAdmissionYearFromClass(studentClass)
    }

    if (!admissionYear || admissionYear < 2000) {
      return 1
    }

    return this.calcSemesterIndex(admissionYear, semester)
  }

  private calcSemesterIndex(admissionYear: number, semester: any): number {
    // Parse semester label like "2025-2026-2" or use academicYear and termCode
    const label = semester.label ?? ''
    const parts = label.split('-')
    let firstYear: number | null = null
    let term: number | null = null

    if (parts.length >= 3) {
      firstYear = Number(parts[0])
      term = Number(parts[parts.length - 1])
    }

    if (!firstYear || Number.isNaN(firstYear)) {
      // fallback: use academicYear
      const ayMatch = (semester.academicYear ?? '').match(/(\d{4})/)
      firstYear = ayMatch ? Number(ayMatch[1]) : new Date().getFullYear()
    }

    if (!term || Number.isNaN(term)) {
      const tcMatch = (semester.termCode ?? '').match(/(\d)/)
      term = tcMatch ? Number(tcMatch[1]) : 1
    }

    const yearsStudied = firstYear - admissionYear
    return Math.max(1, yearsStudied * 2 + term)
  }

  private asRuleSettings(settings: any, semesterType: 'MAIN' | 'SUMMER'): RuleSettings {
    return {
      simulationNow: settings.simulationNow.toISOString(),
      registrationStart: settings.registrationStart.toISOString(),
      registrationEnd: settings.registrationEnd.toISOString(),
      adjustmentStart: settings.adjustmentStart.toISOString(),
      adjustmentEnd: settings.adjustmentEnd.toISOString(),
      maxCreditsMain: settings.maxCreditsMain,
      maxCreditsSummer: settings.maxCreditsSummer,
      maxClassesPerDay: settings.maxClassesPerDay,
      maxClassesPerSemester: settings.maxClassesPerSemester,
      allowWaitlist: settings.allowWaitlist,
      countWaitlistCredits: settings.countWaitlistCredits,
      allowGradeImprovement: settings.allowGradeImprovement,
      maxRetakeAttempts: settings.maxRetakeAttempts,
      semesterType,
      currentSemesterId: settings.currentSemesterId,
    }
  }

  private asRuleSection(section: any): RuleSection {
    return {
      id: section.id,
      courseCode: section.courseCode,
      sectionCode: section.sectionCode,
      semesterId: section.semesterId,
      weekday: section.weekday,
      startPeriod: section.startPeriod,
      periodCount: section.periodCount,
      weeks: section.weeks,
      additionalSchedules: section.additionalSchedules,
      makeUpSchedules: section.makeUpSchedules,
      cancelledDates: section.cancelledDates,
      startDate: section.startDate?.toISOString?.()?.slice(0, 10) ?? section.startDate ?? null,
      endDate: section.endDate?.toISOString?.()?.slice(0, 10) ?? section.endDate ?? null,
      capacity: section.capacity,
      minCapacity: section.minCapacity ?? 0,
      registeredCount: section.registeredCount,
      allowWaitlist: section.allowWaitlist,
      status: section.status,
    }
  }

  private computeRegistrationStatus(
    section: any,
    semester: any,
    settings: any,
    studentEnrollment: any | undefined,
  ): RegistrationStatus {
    // If student already has active enrollment
    if (studentEnrollment) {
      if (studentEnrollment.status === 'REGISTERED') return 'REGISTERED'
      if (studentEnrollment.status === 'WAITLISTED') return 'WAITLIST'
      if (studentEnrollment.status === 'PENDING') return 'PENDING'
    }

    // Section-level status
    if (section.status === 'CANCELLED') return 'CANCELLED'
    if (section.status === 'CLOSED' || section.status === 'COMPLETED' || section.status === 'IN_PROGRESS')
      return 'CLOSED'

    // Check registration window
    const now = new Date(settings.simulationNow).getTime()
    const regStart = new Date(settings.registrationStart).getTime()
    const regEnd = new Date(settings.registrationEnd).getTime()
    const adjEnd = new Date(settings.adjustmentEnd).getTime()

    // Check phases if available
    const phases = (semester as any)?.phases
    let isWithinAnyPhase = false
    if (phases && phases.length > 0) {
      for (const p of phases) {
        const pStart = new Date(p.startDate).getTime()
        const pEnd = new Date(p.endDate).getTime()
        if (now >= pStart && now <= pEnd && p.allowRegister) {
          isWithinAnyPhase = true
          break
        }
      }
    }

    const isInRegistrationWindow =
      phases && phases.length > 0
        ? isWithinAnyPhase
        : now >= regStart && now <= regEnd

    if (!isInRegistrationWindow) {
      if (now < regStart) return 'UPCOMING'
      return 'CLOSED'
    }

    // Capacity
    if (section.registeredCount >= section.capacity) {
      if (section.allowWaitlist && settings.allowWaitlist) return 'WAITLIST'
      return 'FULL'
    }

    return 'OPEN'
  }

  private getAcademicStatus(
    courseCode: string,
    passedCodes: Set<string>,
    failedCodes: Set<string>,
    ongoingCodes: Set<string>,
    activeEnrollmentCourses: Set<string>,
  ): AcademicStatus {
    if (passedCodes.has(courseCode)) return 'PASSED'
    if (activeEnrollmentCourses.has(courseCode)) return 'REGISTERED'
    if (ongoingCodes.has(courseCode)) return 'IN_PROGRESS'
    if (failedCodes.has(courseCode)) return 'FAILED'
    return 'NOT_STUDIED'
  }

  // ── Filter mode implementations ────────────────────────────────────

  private filterByCourse(
    query: CourseOptionsQueryDto,
    courses: any[],
    sectionsByCourse: Map<string, any[]>,
  ): string[] {
    const keyword = (query.keyword ?? query.courseCode ?? '').trim().toLowerCase()
    if (!keyword) {
      // Return all courses that have sections
      return Array.from(sectionsByCourse.keys())
    }

    // Search by code or name
    const extractedCode = keyword.split(' - ')[0]?.trim() ?? keyword

    return courses
      .filter((c) => {
        if (!sectionsByCourse.has(c.code)) return false
        return (
          c.code.toLowerCase().includes(extractedCode) ||
          c.name.toLowerCase().includes(keyword)
        )
      })
      .map((c) => c.code)
  }

  private filterOpenForClass(
    student: any,
    courses: any[],
    sectionsByCourse: Map<string, any[]>,
    semester: any,
  ): string[] {
    const studentClass = student.studentClass ?? ''
    const classDept = getDepartmentFromClass(studentClass)
    
    // Calculate semester index based on class admission year
    const admissionYear = getAdmissionYearFromClass(studentClass)
    let classSemesterIndex = 1
    if (admissionYear) {
      classSemesterIndex = this.calcSemesterIndex(admissionYear, semester)
    }

    console.log('[filterOpenForClass] Student Class:', studentClass, 'Class Dept:', classDept, 'Class Semester Index:', classSemesterIndex)

    return courses
      .filter((c) => {
        if (!sectionsByCourse.has(c.code)) return false

        if (!studentClass) return true

        // 1. Filter by department
        if (classDept && c.department !== classDept) {
          return false
        }

        // 2. Filter by suggestedSemester (must match student's current semester index)
        // Tạm thời comment điều kiện này vì trong Database hiện tại tất cả môn đều có suggestedSemester = 1
        // Nếu bật sẽ trả về 0 kết quả cho sinh viên năm 3 (semesterIndex = 7)
        // if (c.suggestedSemester) {
        //   if (c.suggestedSemester !== classSemesterIndex) {
        //     return false
        //   }
        // }

        // 3. Filter by specific class config (e.g. INT101 for D22CQCN01-N)
        if (!isCourseAllowedForClass(c.name, studentClass)) {
          return false
        }

        return true
      })
      .map((c) => c.code)
  }

  private filterCurriculumPlan(
    semesterIndex: number,
    studentClass: string | null | undefined,
    courses: any[],
    sectionsByCourse: Map<string, any[]>,
  ): string[] {
    const classDept = studentClass ? getDepartmentFromClass(studentClass) : null

    return courses
      .filter((c) => {
        if (!sectionsByCourse.has(c.code)) return false

        // Filter by department first
        if (classDept && c.department !== classDept) return false
        
        // 1. Must match suggested semester
        // Tạm thời comment điều kiện này vì trong Database hiện tại tất cả môn đều có suggestedSemester = 1
        // Nếu bật sẽ trả về 0 kết quả cho sinh viên năm 3 (semesterIndex = 7)
        // if (c.suggestedSemester !== semesterIndex) return false

        // (Đã gỡ bỏ check isCourseAllowedForClass để hiển thị toàn bộ môn trong CTĐT)
        return true
      })
      .map((c) => c.code)
  }

  private filterNotStudied(
    semesterIndex: number,
    studentClass: string | null | undefined,
    courses: any[],
    sectionsByCourse: Map<string, any[]>,
    passedCodes: Set<string>,
    ongoingCodes: Set<string>,
    failedCodes: Set<string>,
    activeEnrollmentCourses: Set<string>,
  ): string[] {
    const classDept = studentClass ? getDepartmentFromClass(studentClass) : null

    return courses
      .filter((c) => {
        if (!sectionsByCourse.has(c.code)) return false
        
        // Filter by department first
        if (classDept && c.department !== classDept) return false
        
        // Only courses with suggestedSemester <= current (not future courses)
        // Note: Currently DB has suggestedSemester=1 for all courses, so this won't filter out future courses yet
        if (!c.suggestedSemester || c.suggestedSemester > semesterIndex) return false
        
        // Exclude passed
        if (passedCodes.has(c.code)) return false
        // Exclude ongoing / in-progress
        if (ongoingCodes.has(c.code)) return false
        // Exclude actively registered
        if (activeEnrollmentCourses.has(c.code)) return false
        // Exclude failed (those go to FAILED_COURSES mode)
        if (failedCodes.has(c.code)) return false
        return true
      })
      .map((c) => c.code)
  }

  private filterFailedCourses(
    failedCodes: Set<string>,
    sectionsByCourse: Map<string, any[]>,
  ): string[] {
    return Array.from(failedCodes).filter((code) => sectionsByCourse.has(code))
  }

  private filterByDepartment(
    query: CourseOptionsQueryDto,
    courses: any[],
    sectionsByCourse: Map<string, any[]>,
  ): string[] {
    const dept = (query.department ?? '').trim()
    if (!dept) {
      return Array.from(sectionsByCourse.keys())
    }

    return courses
      .filter((c) => {
        if (!sectionsByCourse.has(c.code)) return false
        const courseDept = c.faculty ?? c.department
        return courseDept === dept || c.department === dept
      })
      .map((c) => c.code)
  }

  private filterBySection(
    query: CourseOptionsQueryDto,
    sections: any[],
    courses: any[],
  ): string[] {
    const keyword = (query.keyword ?? query.sectionCode ?? '').trim().toLowerCase()
    if (!keyword) {
      return [...new Set(sections.map((s) => s.courseCode))]
    }

    const matchedCourseCodes = new Set<string>()
    for (const sec of sections) {
      const course = courses.find((c) => c.code === sec.courseCode)
      if (
        sec.sectionCode.toLowerCase().includes(keyword) ||
        sec.courseCode.toLowerCase().includes(keyword) ||
        course?.name?.toLowerCase().includes(keyword) ||
        sec.lecturer?.fullName?.toLowerCase().includes(keyword)
      ) {
        matchedCourseCodes.add(sec.courseCode)
      }
    }

    return Array.from(matchedCourseCodes)
  }
}
