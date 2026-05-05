import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseStatus, Prisma, Section, SectionStatus, UserRole } from '@prisma/client'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateSectionDto } from './dto/create-section.dto'
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

const PRESERVED_SECTION_STATUSES: SectionStatus[] = [
  SectionStatus.CANCELLED,
  SectionStatus.CLOSED,
  SectionStatus.COMPLETED,
  SectionStatus.IN_PROGRESS,
]

export function getSectionStatus(section: Pick<Section, 'status' | 'registeredCount' | 'capacity'>) {
  if (PRESERVED_SECTION_STATUSES.includes(section.status)) {
    return section.status
  }

  return section.registeredCount >= section.capacity ? SectionStatus.FULL : SectionStatus.OPEN
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
    payload: Pick<Section, 'id' | 'semesterId' | 'lecturerId' | 'room' | 'weekday' | 'startPeriod' | 'periodCount'>,
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
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount),
    )

    if (lecturerConflict) {
      throw new BadRequestException('Giảng viên bị trùng lịch giảng dạy.')
    }

    const roomConflict = comparedSections.some(
      (section) =>
        section.room === payload.room &&
        overlaps(section.startPeriod, section.periodCount, payload.startPeriod, payload.periodCount),
    )

    if (roomConflict) {
      throw new BadRequestException('Phòng học đã được gán tại khung giờ này.')
    }
  }

  async findAll(query: Record<string, any> = {}) {
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
    })

    const section = await this.prisma.section.create({
      data: {
        sectionCode: createSectionDto.sectionCode,
        courseCode: createSectionDto.courseCode,
        semesterId: createSectionDto.semesterId,
        group: createSectionDto.group,
        subGroup: createSectionDto.subGroup ?? '',
        lecturerId: createSectionDto.lecturerId,
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
    })

    const section = await this.prisma.section.update({
      where: { id },
      data: {
        ...updateSectionDto,
        status: updateSectionDto.status ?? getSectionStatus(nextSection),
      },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'UPDATE_SECTION',
      section.id,
      'SUCCESS',
      `Cập nhật lớp ${section.sectionCode}.`,
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
    const section = await this.prisma.section.update({
      where: { id },
      data: { status: SectionStatus.CANCELLED },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'CANCEL_SECTION',
      id,
      'WARNING',
      `Hủy lớp học phần ${section.sectionCode}.`,
    )

    return section
  }
}
