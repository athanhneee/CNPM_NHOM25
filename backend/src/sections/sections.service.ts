import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseStatus, EnrollmentStatus, Prisma, Section, SectionStatus, UserRole } from '@prisma/client'
import { RequestUser } from '../common/types/request-user'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles, toPublicUser } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSectionDto } from './dto/create-section.dto'
import { SectionQueryDto } from './dto/section-query.dto'
import {
  AssignLecturerDto,
  UpdateCapacityDto,
  UpdateRoomScheduleDto,
  UpdateSectionDto,
} from './dto/update-section.dto'

function overlaps(startA: number, countA: number, startB: number, countB: number) {
  const endA = startA + countA
  const endB = startB + countB
  return startA < endB && startB < endA
}

export function parseWeeks(weeks: string | null | undefined): Set<number> {
  if (!weeks || !weeks.trim()) {
    return new Set()
  }

  const result = new Set<number>()
  for (const segment of weeks.split(',')) {
    const trimmed = segment.trim()
    if (!trimmed) continue
    const rangeParts = trimmed.split('-')
    if (rangeParts.length === 1) {
      const num = Number(rangeParts[0])
      if (Number.isNaN(num) || num <= 0) continue
      result.add(num)
    } else if (rangeParts.length === 2) {
      const start = Number(rangeParts[0])
      const end = Number(rangeParts[1])
      if (Number.isNaN(start) || Number.isNaN(end) || start <= 0 || end < start) continue
      for (let i = start; i <= end; i++) {
        result.add(i)
      }
    }
  }

  return result
}

function weeksOverlap(weeksA: string | null | undefined, weeksB: string | null | undefined): boolean {
  const setA = parseWeeks(weeksA)
  const setB = parseWeeks(weeksB)
  if (setA.size === 0 || setB.size === 0) {
    return true
  }
  for (const w of setA) {
    if (setB.has(w)) return true
  }
  return false
}

const PRESERVED_SECTION_STATUSES: SectionStatus[] = [
  SectionStatus.CANCELLED,
  SectionStatus.CLOSED,
  SectionStatus.COMPLETED,
  SectionStatus.IN_PROGRESS,
]

const SECTION_CANCELLATION_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.PENDING,
  EnrollmentStatus.REGISTERED,
  EnrollmentStatus.WAITLISTED,
]

function timelineArray(value: Prisma.JsonValue): Prisma.InputJsonValue[] {
  return Array.isArray(value) ? (value as Prisma.InputJsonValue[]) : []
}

export function getSectionStatus(section: Pick<Section, 'status' | 'registeredCount' | 'capacity'>) {
  if (PRESERVED_SECTION_STATUSES.includes(section.status)) {
    return section.status
  }

  return section.registeredCount >= section.capacity ? SectionStatus.FULL : SectionStatus.OPEN
}

export function summarizeSectionCancellation(enrollments: Array<{ status: EnrollmentStatus }>) {
  const cancellable = enrollments.filter((enrollment) =>
    SECTION_CANCELLATION_ENROLLMENT_STATUSES.includes(enrollment.status),
  )

  return {
    cancelledEnrollmentCount: cancellable.length,
    pendingCancelled: cancellable.filter((enrollment) => enrollment.status === EnrollmentStatus.PENDING).length,
    registeredCancelled: cancellable.filter((enrollment) => enrollment.status === EnrollmentStatus.REGISTERED)
      .length,
    waitlistCancelled: cancellable.filter((enrollment) => enrollment.status === EnrollmentStatus.WAITLISTED)
      .length,
  }
}

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  private async getExistingSection(id: string) {
    const section = await this.prisma.section.findUnique({ where: { id } })
    if (!section) {
      throw new NotFoundException('Không tìm thấy lớp học phần.')
    }

    return section
  }

  private async assertUniqueSectionCode(sectionCode: string, semesterId: string, ignoredSectionId?: string) {
    const duplicate = await this.prisma.section.findFirst({
      where: {
        sectionCode,
        semesterId,
        id: ignoredSectionId ? { not: ignoredSectionId } : undefined,
      },
    })

    if (duplicate) {
      throw new BadRequestException('Mã lớp học phần phải duy nhất trong học kỳ.')
    }
  }

  private async resolveRoom(roomCode: string) {
    const room = await this.prisma.room.findUnique({ where: { code: roomCode } })
    if (!room) {
      throw new BadRequestException('Phòng học không tồn tại trong danh mục phòng.')
    }

    return room
  }

  private async assertCourseSemesterLecturer(courseCode: string, semesterId: string, lecturerId: string) {
    const [course, semester, lecturer] = await Promise.all([
      this.prisma.course.findUnique({ where: { code: courseCode } }),
      this.prisma.semesterOption.findUnique({ where: { id: semesterId } }),
      this.prisma.user.findUnique({ where: { id: lecturerId } }),
    ])

    if (!course || course.status !== CourseStatus.ACTIVE) {
      throw new BadRequestException('Học phần không tồn tại hoặc đã bị vô hiệu hóa.')
    }

    if (!semester) {
      throw new BadRequestException('Học kỳ không tồn tại.')
    }

    if (!lecturer || !normalizeRoles(lecturer.roles).includes(UserRole.LECTURER)) {
      throw new BadRequestException('Người được phân công phải có vai trò giảng viên.')
    }
  }

  private async assertScheduleAvailable(
    payload: Pick<Section, 'id' | 'semesterId' | 'lecturerId' | 'room' | 'weekday' | 'startPeriod' | 'periodCount' | 'weeks'>,
  ) {
    const comparedSections = await this.prisma.section.findMany({
      where: {
        id: { not: payload.id },
        semesterId: payload.semesterId,
        status: { not: SectionStatus.CANCELLED },
        weekday: payload.weekday,
        OR: [{ lecturerId: payload.lecturerId }, { room: payload.room }],
      },
    })

    const lecturerConflict = comparedSections.some(
      (section) =>
        section.lecturerId === payload.lecturerId &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount) &&
        weeksOverlap(section.weeks, payload.weeks),
    )

    if (lecturerConflict) {
      throw new BadRequestException('Giảng viên bị trùng lịch giảng dạy.')
    }

    const roomConflict = comparedSections.some(
      (section) =>
        section.room === payload.room &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount) &&
        weeksOverlap(section.weeks, payload.weeks),
    )

    if (roomConflict) {
      throw new BadRequestException('Phòng học đã được gán tại khung giờ này.')
    }
  }

  async findAll(query: SectionQueryDto = {}) {
    const where: Prisma.SectionWhereInput = {}
    if (query.semesterId) where.semesterId = query.semesterId
    if (query.courseCode) where.courseCode = query.courseCode
    if (query.lecturerId) where.lecturerId = query.lecturerId
    if (query.status) where.status = query.status as SectionStatus
    if (query.campus) where.campus = query.campus
    if (query.search) {
      const search = String(query.search).trim()
      where.OR = [{ sectionCode: { contains: search } }, { courseCode: { contains: search } }, { room: { contains: search } }]
    }

    const { page, limit, skip, take } = parsePagination(query)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.section.findMany({
        where,
        orderBy: [{ sectionCode: 'asc' }],
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.section.count({ where }),
    ])

    return query.page || query.limit ? paginated(items, total, page, limit) : items
  }

  async findOne(id: string) {
    return this.getExistingSection(id)
  }

  async findSectionStudents(id: string, requester: RequestUser) {
    const section = await this.getExistingSection(id)
    const privileged = requester.roles.some((role) => role === UserRole.ADMIN || role === UserRole.ACADEMIC_OFFICE)
    const assignedLecturer = requester.roles.includes(UserRole.LECTURER) && requester.userId === section.lecturerId

    if (!privileged && !assignedLecturer) {
      throw new ForbiddenException('Giảng viên chỉ được xem danh sách sinh viên của lớp được phân công.')
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { sectionId: id },
      include: { student: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    })

    return enrollments.map(({ student, ...enrollment }) => ({
      ...enrollment,
      student: toPublicUser(student),
    }))
  }

  async create(createSectionDto: CreateSectionDto, actor: AuditActor) {
    await this.assertUniqueSectionCode(createSectionDto.sectionCode, createSectionDto.semesterId)
    await this.assertCourseSemesterLecturer(
      createSectionDto.courseCode,
      createSectionDto.semesterId,
      createSectionDto.lecturerId,
    )
    await this.assertScheduleAvailable({
      id: '',
      semesterId: createSectionDto.semesterId,
      lecturerId: createSectionDto.lecturerId,
      room: createSectionDto.room,
      weekday: createSectionDto.weekday,
      startPeriod: createSectionDto.startPeriod,
      periodCount: createSectionDto.periodCount,
      weeks: createSectionDto.weeks,
    })

    const room = await this.resolveRoom(createSectionDto.room)
    if (createSectionDto.capacity > room.capacity) {
      throw new BadRequestException(`Sĩ số lớp (${createSectionDto.capacity}) vượt quá sức chứa phòng ${room.code} (${room.capacity}).`)
    }

    const section = await this.prisma.section.create({
      data: {
        sectionCode: createSectionDto.sectionCode,
        courseCode: createSectionDto.courseCode,
        semesterId: createSectionDto.semesterId,
        group: createSectionDto.group,
        subGroup: createSectionDto.subGroup ?? '',
        lecturerId: createSectionDto.lecturerId,
        roomId: room.id,
        room: createSectionDto.room,
        weekday: createSectionDto.weekday,
        startPeriod: createSectionDto.startPeriod,
        periodCount: createSectionDto.periodCount,
        weeks: createSectionDto.weeks,
        capacity: createSectionDto.capacity,
        allowWaitlist: createSectionDto.allowWaitlist ?? true,
        status: createSectionDto.status ?? SectionStatus.OPEN,
        campus: createSectionDto.campus ?? 'PTIT HCM',
        notes: createSectionDto.notes,
        examSlot: createSectionDto.examSlot,
      },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'CREATE_SECTION',
      section.id,
      'SUCCESS',
      `Tạo mới lớp ${section.sectionCode}.`,
    )

    return section
  }

  async update(id: string, updateSectionDto: UpdateSectionDto, actor: AuditActor) {
    const currentSection = await this.getExistingSection(id)
    const nextSection = { ...currentSection, ...updateSectionDto }

    if (nextSection.capacity < currentSection.registeredCount) {
      throw new BadRequestException('Sức chứa không được nhỏ hơn số sinh viên đã đăng ký.')
    }

    if (
      nextSection.sectionCode !== currentSection.sectionCode ||
      nextSection.semesterId !== currentSection.semesterId
    ) {
      await this.assertUniqueSectionCode(nextSection.sectionCode, nextSection.semesterId, id)
    }

    await this.assertCourseSemesterLecturer(nextSection.courseCode, nextSection.semesterId, nextSection.lecturerId)
    await this.assertScheduleAvailable({
      id,
      semesterId: nextSection.semesterId,
      lecturerId: nextSection.lecturerId,
      room: nextSection.room,
      weekday: nextSection.weekday,
      startPeriod: nextSection.startPeriod,
      periodCount: nextSection.periodCount,
      weeks: nextSection.weeks,
    })

    let roomId: string | undefined
    if (updateSectionDto.room || updateSectionDto.capacity !== undefined) {
      const room = await this.resolveRoom(nextSection.room)
      roomId = updateSectionDto.room ? room.id : undefined
      if (nextSection.capacity > room.capacity) {
        throw new BadRequestException(`Sĩ số lớp (${nextSection.capacity}) vượt quá sức chứa phòng ${room.code} (${room.capacity}).`)
      }
    }

    const section = await this.prisma.section.update({
      where: { id },
      data: {
        ...updateSectionDto,
        roomId,
        status: updateSectionDto.status ?? getSectionStatus(nextSection),
      },
    })

    // Compute changed fields for audit trail
    const changedFields: Record<string, { before: any; after: any }> = {}
    for (const key of Object.keys(updateSectionDto) as Array<keyof typeof updateSectionDto>) {
      const oldVal = (currentSection as any)[key]
      const newVal = (section as any)[key]
      if (oldVal !== newVal && newVal !== undefined) {
        changedFields[key] = { before: oldVal ?? null, after: newVal }
      }
    }

    await appendAuditLog(
      this.prisma,
      actor,
      'UPDATE_SECTION',
      section.id,
      'SUCCESS',
      `Cập nhật lớp ${section.sectionCode}. Các trường thay đổi: ${Object.keys(changedFields).join(', ') || 'không có'}.`,
      { before: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.before])),
        after: Object.fromEntries(Object.entries(changedFields).map(([k, v]) => [k, v.after])) },
    )

    return section
  }

  async assignLecturer(id: string, body: AssignLecturerDto, actor: AuditActor) {
    return this.update(id, { lecturerId: body.lecturerId }, actor)
  }

  async updateRoomSchedule(id: string, body: UpdateRoomScheduleDto, actor: AuditActor) {
    return this.update(id, body, actor)
  }

  async updateCapacity(id: string, body: UpdateCapacityDto, actor: AuditActor) {
    const section = await this.update(id, { capacity: body.capacity }, actor)
    await appendAuditLog(
      this.prisma,
      actor,
      'UPDATE_SECTION_CAPACITY',
      id,
      'SUCCESS',
      `Điều chỉnh sĩ số tối đa của ${section.sectionCode} thành ${body.capacity}.`,
      { reason: body.reason, capacity: body.capacity },
    )
    return section
  }

  async remove(id: string, actor: AuditActor) {
    return this.prisma.$transaction(async (tx) => {
      const currentSection = await tx.section.findUnique({ where: { id } })
      if (!currentSection) {
        throw new NotFoundException('Không tìm thấy lớp học phần.')
      }

      if (currentSection.status === SectionStatus.CANCELLED) {
        throw new BadRequestException('Lớp học phần này đã bị hủy trước đó.')
      }

      const settings = await tx.systemSetting.findUnique({ where: { id: 1 } })
      const now = settings?.simulationNow ?? new Date()
      const activeEnrollments = await tx.enrollment.findMany({
        where: {
          sectionId: id,
          status: { in: SECTION_CANCELLATION_ENROLLMENT_STATUSES },
        },
      })
      const cancellationSummary = summarizeSectionCancellation(activeEnrollments)
      const cancellationReason = `Lớp học phần ${currentSection.sectionCode} bị hủy.`

      // Collect affected student IDs
      const affectedStudentIds = activeEnrollments.map((e) => e.studentId)

      // Cancel all active enrollments + set tuitionStatus to REFUNDED
      await Promise.all(
        activeEnrollments.map((enrollment) =>
          tx.enrollment.update({
            where: { id: enrollment.id },
            data: {
              status: EnrollmentStatus.CANCELLED,
              cancelledAt: now,
              reasonCode: cancellationReason,
              tuitionStatus: 'REFUNDED',
              timeline: [
                ...timelineArray(enrollment.timeline),
                {
                  status: EnrollmentStatus.CANCELLED,
                  timestamp: now.toISOString(),
                  actorId: actor.actorId,
                  actorRole: actor.actorRole,
                  note: cancellationReason,
                },
              ],
            },
          }),
        ),
      )

      const section = await tx.section.update({
        where: { id },
        data: {
          status: SectionStatus.CANCELLED,
          registeredCount: 0,
          waitlistCount: 0,
        },
      })

      // Find alternative sections (same courseCode, same semester, not cancelled)
      const alternativeSections = await tx.section.findMany({
        where: {
          courseCode: currentSection.courseCode,
          semesterId: currentSection.semesterId,
          id: { not: id },
          status: { notIn: [SectionStatus.CANCELLED] },
        },
        select: {
          id: true,
          sectionCode: true,
          weekday: true,
          startPeriod: true,
          periodCount: true,
          room: true,
          campus: true,
          capacity: true,
          registeredCount: true,
          status: true,
          lecturerId: true,
        },
      })

      await appendAuditLog(
        tx,
        actor,
        'CANCEL_SECTION',
        id,
        'WARNING',
        `Hủy lớp học phần ${section.sectionCode}. Đã hủy ${cancellationSummary.cancelledEnrollmentCount} bản ghi đăng ký. Học phí: REFUNDED.`,
        { ...cancellationSummary, affectedStudentIds },
      )

      return {
        section,
        affectedStudentIds,
        cancellationSummary,
        alternativeSections,
      }
    })
  }
}
