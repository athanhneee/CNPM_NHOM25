import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { EnrollmentStatus, Prisma, Section, SectionStatus, UserRole } from '@prisma/client'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEnrollmentDto } from './dto/create-enrollment.dto'
import { EnrollmentQueryDto } from './dto/enrollment-query.dto'
import { OverrideEnrollmentDto, UpdateEnrollmentDto } from './dto/update-enrollment.dto'
import {
  canCancelEnrollment,
  canWithdrawEnrollment,
  evaluateEnrollmentEligibility,
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
  withdrawalDeadline: Date
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
    withdrawalDeadline: settings.withdrawalDeadline.toISOString(),
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
    capacity: section.capacity,
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
      client.semesterOption.findUnique({ where: { id: settings.currentSemesterId } }),
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
            } satisfies RuleUser)
          : undefined,
        section: section ? asRuleSection(section) : undefined,
        targetCourse: targetCourse
          ? ({
              code: targetCourse.code,
              credits: targetCourse.credits,
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
    if (!student || student.status !== 'ACTIVE') {
      throw new ForbiddenException('Tài khoản hiện không thể thực hiện thao tác này.')
    }
  }

  private async syncSectionCounters(client: Prisma.TransactionClient, sectionId: string) {
    const [section, enrollments] = await Promise.all([
      client.section.findUnique({ where: { id: sectionId } }),
      client.enrollment.findMany({ where: { sectionId }, select: { status: true } }),
    ])

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
    return this.registerSection(createEnrollmentDto.studentId, createEnrollmentDto.sectionId, actor)
  }

  async registerSection(studentId: string, sectionId: string, actor: AuditActor) {
    this.assertActorMayActForStudent(studentId, actor)
    return this.prisma.$transaction(
      async (tx) => {
        await this.assertStudentActive(tx, studentId, actor)
        const { context, settings, section } = await this.loadEligibilityContext(tx, studentId, sectionId)
        const result = evaluateEnrollmentEligibility(context)

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
        const enrollment = await tx.enrollment.create({
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

        const registeredCount =
          finalStatus === EnrollmentStatus.REGISTERED ? section.registeredCount + 1 : section.registeredCount
        const waitlistCount =
          finalStatus === EnrollmentStatus.WAITLISTED ? section.waitlistCount + 1 : section.waitlistCount

        await tx.section.update({
          where: { id: sectionId },
          data: {
            registeredCount,
            waitlistCount,
            status: nextSectionStatus({ ...section, registeredCount }),
          },
        })

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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
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

  async cancelEnrollment(id: string, actor: AuditActor, reason?: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx)
        const enrollment = await tx.enrollment.findUnique({ where: { id } })
        if (!enrollment) {
          throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
        }

        this.assertActorMayActForStudent(enrollment.studentId, actor)
        await this.assertStudentActive(tx, enrollment.studentId, actor)

        if (!canCancelEnrollment(settings.simulationNow.toISOString(), asRuleSettings(settings, 'MAIN'))) {
          throw new BadRequestException('Ngoài thời gian điều chỉnh đăng ký.')
        }

        if (!CANCELLABLE_ENROLLMENT_STATUSES.includes(enrollment.status)) {
          throw new BadRequestException('Không thể hủy học phần ở trạng thái hiện tại.')
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
              buildTimelineItem(actor, EnrollmentStatus.CANCELLED, reason ?? 'Hủy học phần trong cửa sổ điều chỉnh.', now),
            ],
          },
        })

        const section = await tx.section.findUnique({ where: { id: enrollment.sectionId } })
        if (section) {
          const registeredCount =
            enrollment.status === EnrollmentStatus.REGISTERED
              ? Math.max(section.registeredCount - 1, 0)
              : section.registeredCount
          const waitlistCount =
            enrollment.status === EnrollmentStatus.WAITLISTED
              ? Math.max(section.waitlistCount - 1, 0)
              : section.waitlistCount

          await tx.section.update({
            where: { id: section.id },
            data: {
              registeredCount,
              waitlistCount,
              status: nextSectionStatus({ ...section, registeredCount }),
            },
          })
        }

        await appendAuditLog(tx, actor, 'CANCEL_ENROLLMENT', id, 'SUCCESS', 'Hủy đăng ký học phần thành công.', {
          reason: reason ?? null,
        })

        
        let promoted = [];
        if (enrollment.status === 'REGISTERED' && section && section.allowWaitlist) {
          promoted = await this._processWaitlist(tx, section.id, actor, now);
        }
        
        const corequisiteWarnings = await this._checkCorequisiteCascade(tx, enrollment.studentId, section?.semesterId ?? '', section?.courseCode ?? '');
        if (corequisiteWarnings.length > 0) {
           await appendAuditLog(tx, actor, 'COREQUISITE_WARNING', id, 'WARNING', 'Cảnh báo vi phạm môn song hành.', { corequisiteWarnings });
        }

        return { enrollment: updatedEnrollment, promoted, warnings: corequisiteWarnings }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    )
  }

  async withdrawEnrollment(id: string, actor: AuditActor, reason: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const settings = await this.getCurrentSettings(tx)
        const enrollment = await tx.enrollment.findUnique({ where: { id } })
        if (!enrollment) {
          throw new NotFoundException('Không tìm thấy thông tin đăng ký.')
        }

        this.assertActorMayActForStudent(enrollment.studentId, actor)
        await this.assertStudentActive(tx, enrollment.studentId, actor)

        if (!canWithdrawEnrollment(settings.simulationNow.toISOString(), asRuleSettings(settings, 'MAIN'))) {
          throw new BadRequestException('Ngoài cửa sổ rút học phần.')
        }

        if (enrollment.status !== EnrollmentStatus.REGISTERED) {
          throw new BadRequestException('Chỉ có thể rút học phần đã đăng ký.')
        }

        const now = settings.simulationNow
        const updatedEnrollment = await tx.enrollment.update({
          where: { id },
          data: {
            status: EnrollmentStatus.DROPPED,
            droppedAt: now,
            reasonCode: reason,
            timeline: [
              ...timelineArray(enrollment.timeline),
              buildTimelineItem(actor, EnrollmentStatus.DROPPED, reason, now),
            ],
          },
        })

        const section = await tx.section.findUnique({ where: { id: enrollment.sectionId } })
        if (section) {
          const registeredCount = Math.max(section.registeredCount - 1, 0)
          await tx.section.update({
            where: { id: section.id },
            data: {
              registeredCount,
              status: nextSectionStatus({ ...section, registeredCount }),
            },
          })
        }

        await appendAuditLog(tx, actor, 'WITHDRAW_ENROLLMENT', id, 'SUCCESS', 'Rút học phần thành công.', { reason })
        
        if (section) {
          const existingResult = await tx.studentResult.findFirst({
            where: { studentId: enrollment.studentId, courseCode: section.courseCode, semesterId: section.semesterId }
          });
          if (existingResult) {
            await tx.studentResult.update({
              where: { id: existingResult.id },
              data: { letterGrade: 'W', passed: false, status: 'WITHDRAWN' }
            });
          } else {
            await tx.studentResult.create({
              data: {
                studentId: enrollment.studentId,
                courseCode: section.courseCode,
                semesterId: section.semesterId,
                letterGrade: 'W',
                passed: false,
                status: 'WITHDRAWN',
              }
            });
          }
        }
    
        
        let promoted = [];
        if (enrollment.status === 'REGISTERED' && section && section.allowWaitlist) {
          promoted = await this._processWaitlist(tx, section.id, actor, now);
        }
        
        const corequisiteWarnings = await this._checkCorequisiteCascade(tx, enrollment.studentId, section?.semesterId ?? '', section?.courseCode ?? '');
        if (corequisiteWarnings.length > 0) {
           await appendAuditLog(tx, actor, 'COREQUISITE_WARNING', id, 'WARNING', 'Cảnh báo vi phạm môn song hành.', { corequisiteWarnings });
        }

        return { enrollment: updatedEnrollment, promoted, warnings: corequisiteWarnings }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
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

        if (duplicateSection) {
          throw new BadRequestException('Sinh viên đã có bản ghi đăng ký cho lớp này.')
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
        const enrollment = await tx.enrollment.create({
          data: {
            studentId: body.studentId,
            sectionId: body.sectionId,
            semesterId: section.semesterId,
            status: EnrollmentStatus.REGISTERED,
            reasonCode: body.reason,
            timeline: [buildTimelineItem(actor, EnrollmentStatus.REGISTERED, `Override: ${body.reason}`, now)],
          },
        })

        const registeredCount = section.registeredCount + 1
        const waitlistCount = section.waitlistCount

        await tx.section.update({
          where: { id: section.id },
          data: {
            registeredCount,
            waitlistCount,
            status: nextSectionStatus({ ...section, registeredCount }),
          },
        })

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

    const violations: string[] = [];
    for (const enrollment of activeEnrollments) {
      const code = enrollment.section.courseCode;
      const conditions = await tx.courseCondition.findMany({
        where: { courseCode: code, type: 'COREQUISITE' }
      });
      
      let violated = false;
      if (conditions.some((c: any) => c.requiredCourseCode === canceledCourseCode)) {
        violated = true;
      } else {
        const course = await tx.course.findUnique({ where: { code } });
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
    return violations;
  }

  private async _processWaitlist(tx: any, sectionId: string, actor: any, now: Date) {
    const section = await tx.section.findUnique({ where: { id: sectionId } });
    if (!section || section.registeredCount >= section.capacity) return [];

    const waitlisted = await tx.enrollment.findMany({
      where: { sectionId, status: 'WAITLISTED' },
      orderBy: [{ waitlistOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const promoted = [];
    let latestSection = section;

    for (const candidate of waitlisted) {
      if (latestSection.registeredCount >= latestSection.capacity) {
        break;
      }

      const { context } = await this.loadEligibilityContext(tx, candidate.studentId, sectionId);
      // Ensure we import evaluateEnrollmentEligibility if it isn't, but it is.
      const result = evaluateEnrollmentEligibility(context, {
        ignoreRegistrationWindow: true,
        excludedEnrollmentId: candidate.id,
      });

      if (!result.canRegister || result.finalStatus !== 'REGISTERED') {
        continue;
      }

      const updatedEnrollment = await tx.enrollment.update({
        where: { id: candidate.id },
        data: {
          status: 'REGISTERED',
          waitlistOrder: null,
          timeline: [
            ...(Array.isArray(candidate.timeline) ? candidate.timeline : []),
            {
              actorId: actor.id,
              actorRole: actor.role,
              action: 'REGISTERED',
              message: 'Được chuyển từ danh sách chờ sang đăng ký thành công.',
              timestamp: now.toISOString(),
            }
          ],
        },
      });

      const registeredCount = latestSection.registeredCount + 1;
      const waitlistCount = Math.max(latestSection.waitlistCount - 1, 0);
      
      const statusMapping: Record<string, string> = {
        'OPEN': 'OPEN',
        'CLOSED': 'CLOSED',
        'FULL': 'FULL',
        'CANCELLED': 'CANCELLED',
        'IN_PROGRESS': 'IN_PROGRESS',
        'COMPLETED': 'COMPLETED'
      };
      
      latestSection = await tx.section.update({
        where: { id: sectionId },
        data: {
          registeredCount,
          waitlistCount,
          status: registeredCount >= latestSection.capacity ? 'FULL' : statusMapping[latestSection.status] ?? 'OPEN',
        },
      });
      promoted.push(updatedEnrollment);
    }

    if (promoted.length > 0) {
      // Create audit logs for promotion
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

}


