// Prisma Client generated: 2026-06-27T04:14 – includes phases, registrationLocked, tuitionStatus, startDate, endDate, learningMode
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { EnrollmentStatus, Prisma, Section, SectionStatus, UserRole } from '@prisma/client'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEnrollmentDto } from './dto/create-enrollment.dto'
import { EnrollmentQueryDto } from './dto/enrollment-query.dto'
import { OverrideEnrollmentDto, TransferEnrollmentDto, UpdateEnrollmentDto } from './dto/update-enrollment.dto'
import {
  canCancelEnrollment,
  evaluateEnrollmentEligibility,
  checkScheduleConflict,
  EligibilityOptions,
  RuleCourseCondition,
  EnrollmentStatus as RuleEnrollmentStatus,
  RuleCourse,
  RuleEnrollment,
  RuleSection,
  RuleSettings,
  RuleStudentResult,
  RuleUser,
} from './enrollment-rules'

const ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.REGISTERED,
  EnrollmentStatus.WAITLISTED,
  EnrollmentStatus.PENDING,
]

const CANCELLABLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.REGISTERED,
  EnrollmentStatus.WAITLISTED,
]

const PRESERVED_SECTION_STATUSES: SectionStatus[] = [
  SectionStatus.CANCELLED,
  SectionStatus.CLOSED,
  SectionStatus.COMPLETED,
  SectionStatus.IN_PROGRESS,
]

// BUG-007 FIX: Retry helper cho Serializable transaction xung đột
const MAX_SERIALIZATION_RETRIES = 3
const BASE_RETRY_DELAY_MS = 50

async function withSerializableRetry<T>(
  prisma: PrismaService,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  retries = MAX_SERIALIZATION_RETRIES,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (err: any) {
      const isPrismaConflict = err?.code === 'P2034'
      const isSerializationFailure =
        err?.message?.includes('could not serialize') ||
        err?.message?.includes('deadlock detected')

      if ((isPrismaConflict || isSerializationFailure) && attempt < retries) {
        const jitter = Math.random() * BASE_RETRY_DELAY_MS
        await new Promise((resolve) => setTimeout(resolve, BASE_RETRY_DELAY_MS * (attempt + 1) + jitter))
        continue
      }
      throw err
    }
  }
  throw new Error('Không thể hoàn thành thao tác sau nhiều lần thử lại.')
}

function buildTimelineItem(actor: AuditActor, status: EnrollmentStatus, note: string, timestamp: Date) {
  return {
    status,
    timestamp: timestamp.toISOString(),
    actorId: actor.actorId,
    actorRole: actor.actorRole,
    note,
  }
}

function timelineArray(value: Prisma.JsonValue): Prisma.InputJsonValue[] {
  return Array.isArray(value) ? (value as Prisma.InputJsonValue[]) : []
}

function asRuleSettings(settings: {
  simulationNow: Date
  registrationStart: Date
  registrationEnd: Date
  adjustmentStart: Date
  adjustmentEnd: Date
  maxCreditsMain: number
  maxCreditsSummer: number
  maxClassesPerDay: number
  maxClassesPerSemester: number
  allowWaitlist: boolean
  countWaitlistCredits: boolean
  allowGradeImprovement: boolean
  maxRetakeAttempts: number
  currentSemesterId: string
}, semesterType: 'MAIN' | 'SUMMER'): RuleSettings {
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

function asRuleSection(section: Section): RuleSection {
  return {
    id: section.id,
    courseCode: section.courseCode,
    semesterId: section.semesterId,
    weekday: section.weekday,
    startPeriod: section.startPeriod,
    periodCount: section.periodCount,
    weeks: section.weeks,
    additionalSchedules: (section as any).additionalSchedules,
    makeUpSchedules: (section as any).makeUpSchedules,
    cancelledDates: (section as any).cancelledDates,
    startDate: (section as any).startDate?.toISOString?.()?.slice(0, 10) ?? (section as any).startDate ?? null,
    endDate: (section as any).endDate?.toISOString?.()?.slice(0, 10) ?? (section as any).endDate ?? null,
    capacity: section.capacity,
    minCapacity: (section as any).minCapacity,
    registeredCount: section.registeredCount,
    allowWaitlist: section.allowWaitlist,
    status: section.status,
  }
}

function nextSectionStatus(section: Pick<Section, 'status' | 'registeredCount' | 'capacity'>) {
  if (PRESERVED_SECTION_STATUSES.includes(section.status)) {
    return section.status
  }

  return section.registeredCount >= section.capacity ? SectionStatus.FULL : SectionStatus.OPEN
}

export function countSectionEnrollmentStatuses(enrollments: Array<{ status: EnrollmentStatus }>) {
  return {
    registeredCount: enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.REGISTERED).length,
    waitlistCount: enrollments.filter((enrollment) => enrollment.status === EnrollmentStatus.WAITLISTED).length,
  }
}

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  private async getCurrentSettings(client: Prisma.TransactionClient) {
    const settings = await client.systemSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      throw new BadRequestException('Chưa cấu hình tham số hệ thống.')
    }

    return settings
  }

  private async loadEligibilityContext(
    client: Prisma.TransactionClient,
    studentId: string,
    sectionId: string,
  ) {
    const settings = await this.getCurrentSettings(client)
    const [currentSemester, student, section, courses, sections, enrollments, courseConditions, studentResults] = await Promise.all([
      client.semesterOption.findUnique({ where: { id: settings.currentSemesterId }, include: { phases: true } }),
      client.user.findUnique({ where: { id: studentId } }),
      client.section.findUnique({ where: { id: sectionId } }),
      client.course.findMany(),
      client.section.findMany(),
      client.enrollment.findMany({ where: { studentId } }),
      client.courseCondition.findMany(),
      client.studentResult.findMany({ where: { studentId } }),
    ])

    const targetCourse = section ? courses.find((course) => course.code === section.courseCode) : undefined
    const semesterType = (currentSemester?.type as 'MAIN' | 'SUMMER') ?? 'MAIN'

    return {
      settings,
      student,
      section,
      targetCourse,
      context: {
        settings: asRuleSettings(settings, semesterType),
        student: student
          ? ({
              id: student.id,
              roles: normalizeRoles(student.roles),
              status: student.status,
              completedCredits: student.completedCredits ?? 0,
              cohort: (student as any).cohort,
              majorCode: (student as any).majorCode,
              // BUG-013 FIX: Truyền cờ khóa học vụ vào rule engine
              registrationLocked: student.registrationLocked ?? false,
              studentStatus: (student as any).studentStatus ?? undefined,
            } satisfies RuleUser)
          : undefined,
        section: section ? asRuleSection(section) : undefined,
        targetCourse: targetCourse
          ? ({
              code: targetCourse.code,
              credits: targetCourse.credits,
              requiredAccumulatedCredits: (targetCourse as any).requiredAccumulatedCredits,
              prerequisites: targetCourse.prerequisites,
              prestudy: targetCourse.prestudy,
              corequisites: targetCourse.corequisites,
            } satisfies RuleCourse)
          : undefined,
        courses: courses.map(
          (course) =>
            ({
              code: course.code,
              credits: course.credits,
              requiredAccumulatedCredits: (course as any).requiredAccumulatedCredits,
              prerequisites: course.prerequisites,
              prestudy: course.prestudy,
              corequisites: course.corequisites,
            }) satisfies RuleCourse,
        ),
        sections: sections.map(asRuleSection),
        enrollments: enrollments.map(
          (enrollment) =>
            ({
              id: enrollment.id,
              studentId: enrollment.studentId,
              sectionId: enrollment.sectionId,
              semesterId: enrollment.semesterId,
              status: enrollment.status as RuleEnrollmentStatus,
            }) satisfies RuleEnrollment,
        ),
        courseConditions: courseConditions.map(
          (condition) =>
            ({
              courseCode: condition.courseCode,
              requiredCourseCode: condition.requiredCourseCode,
              type: condition.type,
            }) satisfies RuleCourseCondition,
        ),
        studentResults: studentResults.map(
          (result) =>
            ({
              studentId: result.studentId,
              courseCode: result.courseCode,
              status: result.status,
              passed: result.passed,
            }) satisfies RuleStudentResult,
        ),
        phases: (currentSemester as any)?.phases?.map(
          (phase: any) =>
            ({
              id: phase.id,
              name: phase.name,
              startDate: phase.startDate.toISOString(),
              endDate: phase.endDate.toISOString(),
              allowedCohorts: phase.allowedCohorts,
              allowedMajors: phase.allowedMajors,
              maxCredits: phase.maxCredits,
              allowRegister: phase.allowRegister,
              allowCancel: phase.allowCancel,
            })
        ),
        semesterStartDate: currentSemester?.startDate?.toISOString(),
      },
    }
  }

  private assertActorMayActForStudent(studentId: string, actor: AuditActor) {
    if (actor.actorRole === UserRole.ADMIN || actor.actorRole === UserRole.ACADEMIC_OFFICE) {
      return
    }

    if (actor.actorRole === UserRole.STUDENT && actor.actorId === studentId) {
      return
    }

    throw new ForbiddenException('You do not have permission to access this enrollment.')
  }

  private async assertStudentActive(client: Prisma.TransactionClient, studentId: string, actor: AuditActor) {
    if (actor.actorRole === UserRole.ADMIN || actor.actorRole === UserRole.ACADEMIC_OFFICE) {
      return
    }

    const student = await client.user.findUnique({ where: { id: studentId }, select: { status: true } })
    if (!student) {
      throw new ForbiddenException('Không tìm thấy thông tin sinh viên.')
    }

    if (student.status === 'ACTIVE') return

    const statusMessages: Record<string, string> = {
      LOCKED: 'Tài khoản đã bị khóa. Vui lòng liên hệ Phòng Đào tạo để được hỗ trợ.',
      INACTIVE: 'Tài khoản không còn hoạt động.',
      DEFERRED: 'Sinh viên đang trong trạng thái bảo lưu, không thể đăng ký học phần.',
      SUSPENDED: 'Tài khoản đã bị đình chỉ, không thể thực hiện thao tác này.',
    }

    throw new ForbiddenException(
      statusMessages[student.status] ?? 'Tài khoản hiện không thể thực hiện thao tác này.',
    )
  }

  private async syncSectionCounters(client: Prisma.TransactionClient, sectionId: string) {
    const section = await client.section.findUnique({ where: { id: sectionId } })
    const enrollments = await client.enrollment.findMany({ where: { sectionId }, select: { status: true } })

    if (!section) {
      return
    }

    const { registeredCount, waitlistCount } = countSectionEnrollmentStatuses(enrollments)
    await client.section.update({
      where: { id: sectionId },
      data: {
        registeredCount,
        waitlistCount,
        status: nextSectionStatus({ ...section, registeredCount }),
      },
    })
  }

  async findAll(query: EnrollmentQueryDto = {}) {
    const where: Prisma.EnrollmentWhereInput = {}
    if (query.studentId) where.studentId = query.studentId
    if (query.sectionId) where.sectionId = query.sectionId
    if (query.semesterId) where.semesterId = query.semesterId
    if (query.status) where.status = query.status as EnrollmentStatus

    const { page, limit, skip, take } = parsePagination(query)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.enrollment.count({ where }),
    ])

    return query.page || query.limit ? paginated(items, total, page, limit) : items
  }

  async findOne(id: string, actor?: AuditActor) {
    const enrollment = await this.prisma.enrollment.findUnique({ where: { id } })
    if (!enrollment) {
      throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
    }

    if (actor) {
      this.assertActorMayActForStudent(enrollment.studentId, actor)
    }

    return enrollment
  }

  async checkEligibility(studentId: string, sectionId: string, options: EligibilityOptions = {}) {
    return this.prisma.$transaction((tx) =>
      this.loadEligibilityContext(tx, studentId, sectionId).then(({ context }) =>
        evaluateEnrollmentEligibility(context, options),
      ),
    )
  }

  async create(createEnrollmentDto: CreateEnrollmentDto, actor: AuditActor) {
    this.assertActorMayActForStudent(createEnrollmentDto.studentId, actor)
    return this.registerSection(createEnrollmentDto.studentId, createEnrollmentDto.sectionId, actor, createEnrollmentDto.force)
  }

  async registerSection(studentId: string, sectionId: string, actor: AuditActor, force?: boolean) {
    this.assertActorMayActForStudent(studentId, actor)
    try {
      return await withSerializableRetry(this.prisma, async (tx) => {
        await this.assertStudentActive(tx, studentId, actor)

        // Check per-student registration lock
        const studentRecord = await tx.user.findUnique({ where: { id: studentId } })
        if (studentRecord?.registrationLocked && !(actor.actorRole === 'ADMIN' || actor.actorRole === 'ACADEMIC_OFFICE')) {
          throw new ForbiddenException('Tài khoản đăng ký của sinh viên đã bị khóa. Vui lòng liên hệ Phòng Đào tạo.')
        }

        const { context, settings, section } = await this.loadEligibilityContext(tx, studentId, sectionId)

        // Chặn đăng ký nếu course đã bị xóa mềm (INACTIVE)
        const targetCourseRecord = section
          ? (await tx.course.findFirst({ where: { code: section.courseCode } }))
          : null
        if (targetCourseRecord?.status === 'INACTIVE') {
          throw new BadRequestException('Môn học đã ngưng hoạt động, không thể đăng ký.')
        }
        
        const ignoreCapacity = force && (actor.actorRole === 'ADMIN' || actor.actorRole === 'ACADEMIC_OFFICE')
        const result = evaluateEnrollmentEligibility(context, { ignoreCapacity })

        if (!result.canRegister || !result.finalStatus || !section) {
          await appendAuditLog(
            tx,
            actor,
            'REGISTER_COURSE',
            sectionId,
            'FAILURE',
            result.message,
            { errorCode: result.errorCode ?? null },
          )

          return {
            success: false,
            message: result.message,
            errorCode: result.errorCode,
            pdfStatusCode: result.pdfStatusCode,
            checks: result.checks,
          }
        }

        const duplicate = await tx.enrollment.findFirst({
          where: {
            studentId,
            sectionId,
            semesterId: section.semesterId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
          },
        })

        if (duplicate) {
          return {
            success: false,
            message: 'Sinh viên đã có bản ghi đăng ký cho lớp này.',
            errorCode: 'REG_ERR_ALREADY_REGISTERED',
            pdfStatusCode: 'KHONG_DU_DK',
            checks: result.checks,
          }
        }

        const duplicateCourse = await tx.enrollment.findFirst({
          where: {
            studentId,
            sectionId: { not: sectionId },
            semesterId: section.semesterId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
            section: { is: { courseCode: section.courseCode } },
          },
        })

        if (duplicateCourse) {
          const message =
            'Sinh vien da dang ky hoac vao danh sach cho mot lop khac cua cung hoc phan trong hoc ky nay.'
          await appendAuditLog(tx, actor, 'REGISTER_COURSE', sectionId, 'FAILURE', message, {
            errorCode: 'REG_ERR_ALREADY_REGISTERED_COURSE',
            existingEnrollmentId: duplicateCourse.id,
          })

          return {
            success: false,
            message,
            errorCode: 'REG_ERR_ALREADY_REGISTERED_COURSE',
            pdfStatusCode: 'KHONG_DU_DK',
            checks: result.checks,
          }
        }

        const finalStatus = result.finalStatus as EnrollmentStatus
        const waitlistOrder =
          finalStatus === EnrollmentStatus.WAITLISTED
            ? (await tx.enrollment.count({
                where: { sectionId, status: EnrollmentStatus.WAITLISTED },
              })) + 1
            : undefined

        const now = settings.simulationNow
        
        const existingEnrollment = await tx.enrollment.findUnique({
          where: { studentId_sectionId: { studentId, sectionId } }
        })

        let enrollment;
        if (existingEnrollment) {
          enrollment = await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: {
              status: finalStatus,
              waitlistOrder,
              isRetake: result.isRetake ?? false,
              isImprovement: result.isImprovement ?? false,
              timeline: [
                ...(Array.isArray(existingEnrollment.timeline) ? existingEnrollment.timeline : []),
                buildTimelineItem(actor, finalStatus, result.message, now)
              ],
              cancelledAt: null,
              droppedAt: null,
            },
          })
        } else {
          enrollment = await tx.enrollment.create({
            data: {
              studentId,
              sectionId,
              semesterId: section.semesterId,
              status: finalStatus,
              waitlistOrder,
              isRetake: result.isRetake ?? false,
              isImprovement: result.isImprovement ?? false,
              timeline: [buildTimelineItem(actor, finalStatus, result.message, now)],
            },
          })
        }

        // Sync counters from actual enrollment data to prevent drift
        await this.syncSectionCounters(tx, sectionId)

        await appendAuditLog(
          tx,
          actor,
          finalStatus === EnrollmentStatus.WAITLISTED ? 'WAITLIST_COURSE' : 'REGISTER_COURSE',
          sectionId,
          finalStatus === EnrollmentStatus.WAITLISTED ? 'INFO' : 'SUCCESS',
          result.message,
        )

        return {
          success: true,
          message: result.message,
          enrollment,
          pdfStatusCode: result.pdfStatusCode,
          checks: result.checks,
        }
      })
    } catch (err: any) {
      // BUG-007 FIX: Bắt lỗi unique constraint (P2002) từ @@unique([studentId, sectionId])
      if (err?.code === 'P2002') {
        return {
          success: false,
          message: 'Sinh viên đã có bản ghi đăng ký cho lớp này.',
          errorCode: 'REG_ERR_ALREADY_REGISTERED' as const,
          pdfStatusCode: 'KHONG_DU_DK' as const,
          checks: [],
        }
      }
      throw err
    }
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto, actor: AuditActor) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentEnrollment = await tx.enrollment.findUnique({ where: { id } })
        if (!currentEnrollment) {
          throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
        }

        this.assertActorMayActForStudent(currentEnrollment.studentId, actor)
        await this.assertStudentActive(tx, currentEnrollment.studentId, actor)

        const enrollment = await tx.enrollment.update({
          where: { id },
          data: {
            status: updateEnrollmentDto.status,
            reasonCode: updateEnrollmentDto.reasonCode,
          },
        })

        await this.syncSectionCounters(tx, enrollment.sectionId)

        await appendAuditLog(
          tx,
          actor,
          'UPDATE_ENROLLMENT',
          id,
          'SUCCESS',
          'Cập nhật trạng thái đăng ký học phần.',
          { status: updateEnrollmentDto.status ?? null, reasonCode: updateEnrollmentDto.reasonCode ?? null },
        )

        return enrollment
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async cancelEnrollment(id: string, actor: AuditActor, reason?: string, force?: boolean) {
    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx)
        const enrollment = await tx.enrollment.findUnique({ 
          where: { id },
          include: { student: true, semester: { include: { phases: true } } }
        })
        if (!enrollment) {
          throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
        }

        this.assertActorMayActForStudent(enrollment.studentId, actor)
        await this.assertStudentActive(tx, enrollment.studentId, actor)

        const studentRule: RuleUser = {
          id: enrollment.student.id,
          roles: normalizeRoles(enrollment.student.roles),
          status: enrollment.student.status,
          cohort: (enrollment.student as any).cohort ?? undefined,
          majorCode: (enrollment.student as any).majorCode ?? undefined,
        }
        
        const phasesRule = (enrollment.semester as any)?.phases?.map((p: any) => ({
          id: p.id, name: p.name, startDate: p.startDate.toISOString(), endDate: p.endDate.toISOString(),
          allowedCohorts: p.allowedCohorts, allowedMajors: p.allowedMajors,
          maxCredits: p.maxCredits, allowRegister: p.allowRegister, allowCancel: p.allowCancel
        }))

        if (!canCancelEnrollment(settings.simulationNow.toISOString(), asRuleSettings(settings, 'MAIN'), phasesRule, studentRule)) {
          throw new BadRequestException('Ngoài thời gian đăng ký hoặc điều chỉnh đăng ký.')
        }

        if (!CANCELLABLE_ENROLLMENT_STATUSES.includes(enrollment.status)) {
          throw new BadRequestException('Không thể hủy học phần ở trạng thái hiện tại.')
        }

        const isPrivileged = actor.actorRole === 'ADMIN' || actor.actorRole === 'ACADEMIC_OFFICE';
        const isForced = force && isPrivileged;

        if (!isForced) {
          if ((enrollment as any).isMandatory) {
            throw new BadRequestException('Lớp học phần này là bắt buộc, sinh viên không được phép tự hủy.');
          }

          if ((enrollment as any).hasPartialGrades) {
            throw new BadRequestException('Lớp học phần đã có điểm thành phần, không được phép hủy.');
          }

          const sectionToCancel = await tx.section.findUnique({ where: { id: enrollment.sectionId }, include: { course: true } });
          const semesterEnrollments = await tx.enrollment.findMany({
            where: { studentId: enrollment.studentId, semesterId: enrollment.semesterId, status: 'REGISTERED' },
            include: { section: { include: { course: true } } }
          });
          const totalCredits = semesterEnrollments.reduce((sum, e) => sum + e.section.course.credits, 0);
          const canceledCredits = enrollment.status === 'REGISTERED' && sectionToCancel ? sectionToCancel.course.credits : 0;
          
          if (totalCredits - canceledCredits < settings.minCredits) {
             throw new BadRequestException(`Không thể hủy học phần vì tổng tín chỉ sẽ thấp hơn mức tối thiểu (${settings.minCredits} tín chỉ).`);
          }

          const corequisiteWarnings = await this._checkCorequisiteCascade(tx, enrollment.studentId, enrollment.semesterId, sectionToCancel?.courseCode ?? '');
          if (corequisiteWarnings.length > 0) {
             throw new BadRequestException(`Không thể hủy môn học do ràng buộc môn song hành: ${corequisiteWarnings.join(', ')}`);
          }
        }

        const now = settings.simulationNow
        const updatedEnrollment = await tx.enrollment.update({
          where: { id },
          data: {
            status: EnrollmentStatus.CANCELLED,
            cancelledAt: now,
            reasonCode: reason,
            timeline: [
              ...timelineArray(enrollment.timeline),
              buildTimelineItem(actor, EnrollmentStatus.CANCELLED, reason ?? 'Hủy học phần trong thời gian đăng ký/điều chỉnh.', now),
            ],
          },
        })

        const section = await tx.section.findUnique({ where: { id: enrollment.sectionId } })
        if (section) {
          // Sync counters from actual enrollment data to prevent drift
          await this.syncSectionCounters(tx, section.id)
        }

        await appendAuditLog(tx, actor, 'CANCEL_ENROLLMENT', id, 'SUCCESS', 'Hủy đăng ký học phần thành công.', {
          reason: reason ?? null,
        })

        
        let promoted: any[] = [];
        if (enrollment.status === 'REGISTERED' && section && section.allowWaitlist) {
          promoted = await this._processWaitlist(tx, section.id, actor, now);
        }
        
        const corequisiteWarnings = await this._checkCorequisiteCascade(tx, enrollment.studentId, section?.semesterId ?? '', section?.courseCode ?? '');
        if (corequisiteWarnings.length > 0) {
           await appendAuditLog(tx, actor, 'COREQUISITE_WARNING', id, 'WARNING', 'Cảnh báo vi phạm môn song hành.', { corequisiteWarnings });
        }

        return { enrollment: updatedEnrollment, promoted, warnings: corequisiteWarnings }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 20000 },
    )
  }



  async processWaitlist(sectionId: string, actor: AuditActor) {
    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx);
        const promoted = await this._processWaitlist(tx, sectionId, actor, settings.simulationNow);
        
        await appendAuditLog(
          tx,
          actor,
          'PROCESS_WAITLIST',
          sectionId,
          promoted.length ? 'SUCCESS' : 'INFO',
          promoted.length ? `Đã xử lý ${promoted.length} sinh viên từ danh sách chờ.` : 'Không có sinh viên chờ đủ điều kiện.',
          { promotedCount: promoted.length },
        )

        return promoted
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async overrideEnrollment(body: OverrideEnrollmentDto, actor: AuditActor) {
    if (!body.reason.trim()) {
      throw new BadRequestException('Lý do override là bắt buộc.')
    }

    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx)
        const [student, section] = await Promise.all([
          tx.user.findUnique({ where: { id: body.studentId } }),
          tx.section.findUnique({ where: { id: body.sectionId } }),
        ])

        if (!student || !normalizeRoles(student.roles).includes(UserRole.STUDENT)) {
          throw new BadRequestException('Sinh viên không tồn tại hoặc tài khoản không có vai trò sinh viên.')
        }

        if (!section) {
          throw new BadRequestException('Lớp học phần không tồn tại.')
        }

        if (section.status === SectionStatus.CANCELLED) {
          throw new BadRequestException('Lớp học phần đã bị hủy, không thể override.')
        }

        if (section.semesterId !== settings.currentSemesterId) {
          throw new BadRequestException('Lớp học phần không thuộc học kỳ hiện tại.')
        }

        const duplicateSection = await tx.enrollment.findFirst({
          where: {
            studentId: body.studentId,
            sectionId: body.sectionId,
            semesterId: section.semesterId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
          },
        })

        if (duplicateSection && duplicateSection.status === EnrollmentStatus.REGISTERED) {
          throw new BadRequestException('Sinh viên đã có bản ghi đăng ký (REGISTERED) cho lớp này.')
        }

        const duplicateCourse = await tx.enrollment.findFirst({
          where: {
            studentId: body.studentId,
            sectionId: { not: body.sectionId },
            semesterId: section.semesterId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
            section: { is: { courseCode: section.courseCode } },
          },
        })

        if (duplicateCourse) {
          throw new BadRequestException('Sinh viên đã đăng ký hoặc vào danh sách chờ một lớp khác của cùng học phần trong học kỳ này.')
        }

        const capacityOverride = section.registeredCount >= section.capacity
        const now = settings.simulationNow
        
        let enrollment;
        let waitlistCount = section.waitlistCount;
        const registeredCount = section.registeredCount + 1;

        if (duplicateSection) {
          enrollment = await tx.enrollment.update({
            where: { id: duplicateSection.id },
            data: {
              status: EnrollmentStatus.REGISTERED,
              reasonCode: body.reason,
              waitlistOrder: null,
              timeline: [
                ...timelineArray(duplicateSection.timeline),
                buildTimelineItem(actor, EnrollmentStatus.REGISTERED, `Override: ${body.reason}`, now),
              ],
            },
          })
          if (duplicateSection.status === EnrollmentStatus.WAITLISTED) {
            waitlistCount = Math.max(0, waitlistCount - 1)
          }
        } else {
          enrollment = await tx.enrollment.create({
            data: {
              studentId: body.studentId,
              sectionId: body.sectionId,
              semesterId: section.semesterId,
              status: EnrollmentStatus.REGISTERED,
              reasonCode: body.reason,
              timeline: [buildTimelineItem(actor, EnrollmentStatus.REGISTERED, `Override: ${body.reason}`, now)],
            },
          })
        }

        await tx.section.update({
          where: { id: section.id },
          data: {
            registeredCount,
            waitlistCount,
            status: nextSectionStatus({ ...section, registeredCount }),
          },
        })

        // Reorder waitlist if we removed someone from it
        if (duplicateSection?.status === EnrollmentStatus.WAITLISTED) {
          const remainingWaitlisted = await tx.enrollment.findMany({
            where: { sectionId: body.sectionId, status: EnrollmentStatus.WAITLISTED },
            orderBy: [{ waitlistOrder: 'asc' }, { createdAt: 'asc' }],
          })
          for (let i = 0; i < remainingWaitlisted.length; i++) {
            if (remainingWaitlisted[i].waitlistOrder !== i + 1) {
              await tx.enrollment.update({
                where: { id: remainingWaitlisted[i].id },
                data: { waitlistOrder: i + 1 },
              })
            }
          }
        }

        await appendAuditLog(tx, actor, 'OVERRIDE_ENROLLMENT', enrollment.id, 'SUCCESS', 'Override đăng ký học phần.', {
          reason: body.reason,
          capacityOverride,
        })

        return enrollment
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async remove(id: string, actor: AuditActor) {
    return this.prisma.$transaction(
      async (tx) => {
        const currentEnrollment = await tx.enrollment.findUnique({ where: { id } })
        if (!currentEnrollment) {
          throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
        }

        this.assertActorMayActForStudent(currentEnrollment.studentId, actor)

        const enrollment = await tx.enrollment.delete({ where: { id } })
        await this.syncSectionCounters(tx, enrollment.sectionId)
        await appendAuditLog(tx, actor, 'DELETE_ENROLLMENT', id, 'WARNING', 'Xóa bản ghi đăng ký học phần.')
        return enrollment
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  private async _checkCorequisiteCascade(tx: any, studentId: string, semesterId: string, canceledCourseCode: string): Promise<string[]> {
    const activeEnrollments = await tx.enrollment.findMany({
      where: {
        studentId,
        semesterId,
        status: { in: ['REGISTERED', 'WAITLISTED'] }
      },
      include: { section: true }
    });

    const activeCourseCodes = Array.from(new Set(activeEnrollments.map((e: any) => e.section.courseCode as string)));
    if (activeCourseCodes.length === 0) return [];

    const conditions = await tx.courseCondition.findMany({
      where: { courseCode: { in: activeCourseCodes }, type: 'COREQUISITE' }
    });

    const courses = await tx.course.findMany({
      where: { code: { in: activeCourseCodes } }
    });

    const violations: string[] = [];
    for (const enrollment of activeEnrollments) {
      const code = enrollment.section.courseCode;
      
      let violated = false;
      if (conditions.some((c: any) => c.courseCode === code && c.requiredCourseCode === canceledCourseCode)) {
        violated = true;
      } else {
        const course = courses.find((c: any) => c.code === code);
        if (course?.corequisites && Array.isArray(course.corequisites)) {
          if (course.corequisites.includes(canceledCourseCode)) {
            violated = true;
          }
        }
      }

      if (violated) {
        violations.push(`Học phần ${code} yêu cầu môn song hành ${canceledCourseCode} vừa bị rút/hủy.`);
      }
    }
    return Array.from(new Set(violations));
  }

  private async _processWaitlist(tx: Prisma.TransactionClient, sectionId: string, actor: AuditActor, now: Date) {
    // BUG-016 FIX: Lock the section row (SELECT ... FOR UPDATE) to prevent concurrent waitlist processing
    const sections = await tx.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Section" WHERE "id" = $1 FOR UPDATE`,
      sectionId,
    );
    const section = sections[0];
    if (!section || section.registeredCount >= section.capacity) return [];

    const waitlisted = await tx.enrollment.findMany({
      where: { sectionId, status: 'WAITLISTED' },
      orderBy: [{ waitlistOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const promoted: any[] = [];
    let latestRegisteredCount = section.registeredCount;
    let latestWaitlistCount = section.waitlistCount;

    for (const candidate of waitlisted) {
      if (latestRegisteredCount >= section.capacity) {
        break;
      }

      const { context } = await this.loadEligibilityContext(tx, candidate.studentId, sectionId);
      const result = evaluateEnrollmentEligibility(context, {
        ignoreRegistrationWindow: true,
        excludedEnrollmentId: candidate.id,
      });

      if (!result.canRegister || result.finalStatus !== 'REGISTERED') {
        continue;
      }

      // BUG-016 FIX: Dùng đúng properties actorId/actorRole thay vì actor.id/actor.role
      const updatedEnrollment = await tx.enrollment.update({
        where: { id: candidate.id },
        data: {
          status: 'REGISTERED',
          waitlistOrder: null,
          timeline: [
            ...(Array.isArray(candidate.timeline) ? candidate.timeline : []),
            {
              status: 'REGISTERED',
              actorId: actor.actorId,
              actorRole: actor.actorRole,
              note: 'Được chuyển từ danh sách chờ sang đăng ký thành công.',
              timestamp: now.toISOString(),
            }
          ],
        },
      });

      latestRegisteredCount += 1;
      latestWaitlistCount = Math.max(latestWaitlistCount - 1, 0);
      promoted.push(updatedEnrollment);
    }

    if (promoted.length > 0) {
      // Update section counters once after all promotions
      await tx.section.update({
        where: { id: sectionId },
        data: {
          registeredCount: latestRegisteredCount,
          waitlistCount: latestWaitlistCount,
          status: latestRegisteredCount >= section.capacity ? 'FULL' : section.status === 'FULL' ? 'OPEN' : section.status,
        },
      });

      // Reorder remaining waitlist entries
      const remainingWaitlisted = await tx.enrollment.findMany({
        where: { sectionId, status: 'WAITLISTED' },
        orderBy: [{ waitlistOrder: 'asc' }, { createdAt: 'asc' }],
      });
      for (let i = 0; i < remainingWaitlisted.length; i++) {
        if (remainingWaitlisted[i].waitlistOrder !== i + 1) {
          await tx.enrollment.update({
            where: { id: remainingWaitlisted[i].id },
            data: { waitlistOrder: i + 1 },
          });
        }
      }

      // Audit logs for each promotion
      for (const p of promoted) {
        await appendAuditLog(
          tx,
          actor,
          'WAITLIST_PROMOTION',
          p.id,
          'SUCCESS',
          'Tự động duyệt từ danh sách chờ do có slot released.',
          { promotedEnrollmentId: p.id, sectionId }
        );
      }
    }

    return promoted;
  }

  async transferEnrollment(body: TransferEnrollmentDto, actor: AuditActor) {
    if (!body.reason.trim()) {
      throw new BadRequestException('Lý do chuyển lớp là bắt buộc.')
    }

    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx)
        const now = settings.simulationNow

        // 1. Find existing enrollment
        const existingEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId: body.studentId,
            sectionId: body.fromSectionId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
          },
        })

        if (!existingEnrollment) {
          throw new BadRequestException('Sinh viên không có bản ghi đăng ký hoạt động tại lớp nguồn.')
        }

        // 2. Check student is active
        await this.assertStudentActive(tx, body.studentId, actor)

        // 3. Load both sections
        const [fromSection, toSection] = await Promise.all([
          tx.section.findUnique({ where: { id: body.fromSectionId } }),
          tx.section.findUnique({ where: { id: body.toSectionId } }),
        ])

        if (!fromSection) throw new BadRequestException('Lớp nguồn không tồn tại.')
        if (!toSection) throw new BadRequestException('Lớp đích không tồn tại.')

        if (fromSection.courseCode !== toSection.courseCode) {
          throw new BadRequestException('Lớp nguồn và lớp đích phải cùng một học phần.')
        }

        if (fromSection.semesterId !== toSection.semesterId) {
          throw new BadRequestException('Lớp nguồn và lớp đích phải cùng một học kỳ.')
        }

        if (toSection.status === SectionStatus.CANCELLED) {
          throw new BadRequestException('Lớp đích đã bị hủy.')
        }

        // 4. Check target capacity
        if (toSection.registeredCount >= toSection.capacity) {
          throw new BadRequestException(`Lớp đích ${toSection.sectionCode} đã đủ sĩ số (${toSection.registeredCount}/${toSection.capacity}).`)
        }

        // 5. Check duplicate at target
        const duplicateAtTarget = await tx.enrollment.findFirst({
          where: {
            studentId: body.studentId,
            sectionId: body.toSectionId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
          },
        })

        if (duplicateAtTarget) {
          throw new BadRequestException('Sinh viên đã có đăng ký tại lớp đích.')
        }

        // 6. Check schedule conflict with other classes (excluding fromSection)
        const otherEnrollments = await tx.enrollment.findMany({
          where: {
            studentId: body.studentId,
            semesterId: fromSection.semesterId,
            status: { in: ACTIVE_ENROLLMENT_STATUSES },
            sectionId: { not: body.fromSectionId },
          },
          include: { section: true },
        })

        if (otherEnrollments.length > 0) {
          const semester = await tx.semesterOption.findUnique({ where: { id: toSection.semesterId } })
          const conflict = checkScheduleConflict(
            asRuleSection(toSection),
            otherEnrollments.map(e => asRuleSection(e.section)),
            semester?.startDate?.toISOString()
          )
          if (conflict) {
            throw new BadRequestException(
              `Lớp đích ${toSection.sectionCode} bị trùng lịch với lớp (ID: ${conflict.conflictSectionId}).`
            )
          }
        }

        // 7. Cancel old enrollment
        await tx.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: EnrollmentStatus.CANCELLED,
            cancelledAt: now,
            reasonCode: `Chuyển lớp: ${body.reason}`,
            timeline: [
              ...timelineArray(existingEnrollment.timeline),
              buildTimelineItem(actor, EnrollmentStatus.CANCELLED, `Chuyển sang lớp ${toSection.sectionCode}: ${body.reason}`, now),
            ],
          },
        })

        // 8. Decrease from section count
        const fromRegisteredCount = existingEnrollment.status === EnrollmentStatus.REGISTERED
          ? Math.max(fromSection.registeredCount - 1, 0)
          : fromSection.registeredCount
        const fromWaitlistCount = existingEnrollment.status === EnrollmentStatus.WAITLISTED
          ? Math.max(fromSection.waitlistCount - 1, 0)
          : fromSection.waitlistCount

        await tx.section.update({
          where: { id: body.fromSectionId },
          data: {
            registeredCount: fromRegisteredCount,
            waitlistCount: fromWaitlistCount,
            status: nextSectionStatus({ ...fromSection, registeredCount: fromRegisteredCount }),
          },
        })

        // 9. Create new enrollment
        const newEnrollment = await tx.enrollment.create({
          data: {
            studentId: body.studentId,
            sectionId: body.toSectionId,
            semesterId: toSection.semesterId,
            status: EnrollmentStatus.REGISTERED,
            isRetake: existingEnrollment.isRetake,
            isImprovement: existingEnrollment.isImprovement,
            timeline: [
              buildTimelineItem(actor, EnrollmentStatus.REGISTERED, `Chuyển từ lớp ${fromSection.sectionCode}: ${body.reason}`, now),
            ],
          },
        })

        // 10. Increase to section count
        const toRegisteredCount = toSection.registeredCount + 1
        await tx.section.update({
          where: { id: body.toSectionId },
          data: {
            registeredCount: toRegisteredCount,
            status: nextSectionStatus({ ...toSection, registeredCount: toRegisteredCount }),
          },
        })

        // 11. Process waitlist on old section
        let promoted: any[] = []
        if (existingEnrollment.status === EnrollmentStatus.REGISTERED && fromSection.allowWaitlist) {
          promoted = await this._processWaitlist(tx, body.fromSectionId, actor, now)
        }

        // 12. Audit
        await appendAuditLog(
          tx,
          actor,
          'TRANSFER_ENROLLMENT',
          newEnrollment.id,
          'SUCCESS',
          `Chuyển sinh viên ${body.studentId} từ lớp ${fromSection.sectionCode} sang ${toSection.sectionCode}.`,
          { fromSectionId: body.fromSectionId, toSectionId: body.toSectionId, reason: body.reason },
        )

        return {
          cancelledEnrollment: existingEnrollment.id,
          newEnrollment,
          promoted,
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async bulkRegister(
    rows: Array<{ studentId: string; sectionId: string }>,
    actor: AuditActor,
  ) {
    const results: {
      success: Array<{ studentId: string; sectionId: string; enrollmentId: string }>
      failed: Array<{ studentId: string; sectionId: string; error: string }>
    } = { success: [], failed: [] }

    for (const row of rows) {
      try {
        const result = await this.registerSection(row.studentId, row.sectionId, actor)
        
        if (result.success && result.enrollment) {
          results.success.push({
            studentId: row.studentId,
            sectionId: row.sectionId,
            enrollmentId: result.enrollment.id,
          })
        } else {
          results.failed.push({
            studentId: row.studentId,
            sectionId: row.sectionId,
            error: result.message ?? 'Lỗi kiểm tra điều kiện',
          })
        }
      } catch (err: any) {
        results.failed.push({
          studentId: row.studentId,
          sectionId: row.sectionId,
          error: err.message ?? 'Lỗi không xác định',
        })
      }
    }

    await appendAuditLog(
      this.prisma,
      actor,
      'BULK_REGISTER',
      'BATCH',
      results.failed.length === 0 ? 'SUCCESS' : 'WARNING',
      `Nhập hàng loạt: ${results.success.length} thành công, ${results.failed.length} thất bại.`,
      { totalRows: rows.length, successCount: results.success.length, failedCount: results.failed.length },
    )

    return results
  }

}


