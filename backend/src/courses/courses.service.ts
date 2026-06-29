import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseStatus, Prisma } from '@prisma/client'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
import { CourseQueryDto } from './dto/course-query.dto'
import { CreateCourseDto } from './dto/create-course.dto'
import { UpdateCourseDto } from './dto/update-course.dto'

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  private stringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
  }

  private withConditionArrays<T extends { prerequisites: unknown; prestudy: unknown; corequisites: unknown }>(
    course: T & { conditions?: Array<{ requiredCourseCode: string; type: string }> },
  ) {
    const { conditions, ...rest } = course
    const byType = (type: string, fallback: unknown) => {
      const codes = conditions
        ?.filter((condition) => condition.type === type)
        .map((condition) => condition.requiredCourseCode)

      return codes?.length ? codes : this.stringArray(fallback)
    }

    return {
      ...rest,
      prerequisites: byType('PREREQUISITE', course.prerequisites),
      prestudy: byType('PRESTUDY', course.prestudy),
      corequisites: byType('COREQUISITE', course.corequisites),
    }
  }

  private async validateAndSyncConditions(
    client: Prisma.TransactionClient,
    courseCode: string,
    relations: {
      prerequisites?: string[]
      prestudy?: string[]
      corequisites?: string[]
    },
  ) {
    const allCodes = [
      ...(relations.prerequisites ?? []),
      ...(relations.prestudy ?? []),
      ...(relations.corequisites ?? []),
    ]

    for (const code of allCodes) {
      if (code === courseCode) {
        throw new BadRequestException(`Môn học không thể yêu cầu chính nó làm điều kiện (${code}).`)
      }
    }

    if (allCodes.length > 0) {
      const existingCourses = await client.course.findMany({
        where: { code: { in: allCodes } },
        select: { code: true },
      })
      const existingCodes = new Set(existingCourses.map((c) => c.code))
      for (const code of allCodes) {
        if (!existingCodes.has(code)) {
          throw new BadRequestException(`Môn học điều kiện không tồn tại: ${code}.`)
        }
      }
    }

    const seen = new Set<string>()
    const data = [
      ...(relations.prerequisites ?? []).map((requiredCourseCode) => ({
        courseCode,
        requiredCourseCode,
        type: 'PREREQUISITE' as const,
      })),
      ...(relations.prestudy ?? []).map((requiredCourseCode) => ({
        courseCode,
        requiredCourseCode,
        type: 'PRESTUDY' as const,
      })),
      ...(relations.corequisites ?? []).map((requiredCourseCode) => ({
        courseCode,
        requiredCourseCode,
        type: 'COREQUISITE' as const,
      })),
    ]

    for (const entry of data) {
      const key = `${entry.type}:${entry.requiredCourseCode}`
      if (seen.has(key)) {
        throw new BadRequestException(`Điều kiện trùng lặp: ${entry.type} - ${entry.requiredCourseCode}.`)
      }
      seen.add(key)
    }

    await client.courseCondition.deleteMany({ where: { courseCode } })
    if (data.length) {
      await client.courseCondition.createMany({ data, skipDuplicates: true })
    }
  }

  private async assertUniqueCode(code: string, ignoredCourseId?: string) {
    const duplicate = await this.prisma.course.findFirst({
      where: {
        code,
        id: ignoredCourseId ? { not: ignoredCourseId } : undefined,
      },
    })

    if (duplicate) {
      throw new BadRequestException('Course code already exists.')
    }
  }

  /**
   * Map mã ngành 2 chữ cái (suy từ class code) → mã khoa (department code trong DB).
   * Ví dụ: D23CQCN01-N → CN → INT
   */
  private static readonly MAJOR_CODE_TO_DEPARTMENT: Record<string, string> = {
    CN: 'INT',
    AT: 'SEC',
    VT: 'TEL',
    DT: 'ELE',
    PT: 'MUL',
    QT: 'BUS',
    MR: 'MKT',
    KT: 'ACC',
  }

  /**
   * Parse mã ngành 2 chữ cái từ tên lớp sinh viên.
   * Hỗ trợ cả format CQXX (Chính Quy) và DCXX (Đào tạo từ xa).
   * Ví dụ:
   * - D23CQCN01-N → CN
   * - N23DCCN001 → CN
   * - D24CQKT01-N → KT
   */
  private parseMajorCodeFromClass(classCode: string): string | null {
    const upper = classCode.toUpperCase()
    // Pattern: after CQ or DC, get the next 2 letters
    const match = upper.match(/(?:CQ|DC)([A-Z]{2})/)
    return match ? match[1] : null
  }

  /**
   * Suy department code từ class code.
   * Trả về null nếu không nhận diện được ngành.
   */
  private resolveDepartmentFromClass(classCode: string): string | null {
    const majorCode = this.parseMajorCodeFromClass(classCode)
    if (!majorCode) return null
    return CoursesService.MAJOR_CODE_TO_DEPARTMENT[majorCode] ?? null
  }

  async findAll(query: CourseQueryDto = {}) {
    const where: Prisma.CourseWhereInput = {}

    // ── Lọc theo lớp sinh viên (studentClass) ──
    // Parse classCode → majorCode → department → lọc courses thuộc department đó
    if (query.studentClass) {
      const department = this.resolveDepartmentFromClass(query.studentClass)
      if (department) {
        where.department = department
      }
    } else if (query.department) {
      where.department = query.department
    }

    if (query.campus) where.campus = query.campus
    if (query.status) where.status = query.status as CourseStatus
    if (query.category) where.category = query.category
    if (query.suggestedSemester !== undefined) where.suggestedSemester = query.suggestedSemester
    if (query.semesterId) {
      where.sections = {
        some: {
          semesterId: query.semesterId,
        },
      }
    }
    if (query.search) {
      const search = String(query.search).trim()
      where.OR = [{ code: { contains: search } }, { name: { contains: search } }]
    }

    const { page, limit, skip, take } = parsePagination(query)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: { conditions: true },
        orderBy: { code: 'asc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.course.count({ where }),
    ])

    const mappedItems = items.map((course) => this.withConditionArrays(course))
    return query.page || query.limit ? paginated(mappedItems, total, page, limit) : mappedItems
  }

  async findOne(idOrCode: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
      include: { conditions: true },
    })

    if (!course) {
      throw new NotFoundException('Course not found.')
    }

    return this.withConditionArrays(course)
  }

  async findByCode(code: string) {
    const course = await this.prisma.course.findUnique({ where: { code }, include: { conditions: true } })
    if (!course) {
      throw new NotFoundException('Course not found.')
    }

    return this.withConditionArrays(course)
  }

  async create(createCourseDto: CreateCourseDto, actor: AuditActor) {
    await this.assertUniqueCode(createCourseDto.code)

    const course = await this.prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: {
          ...createCourseDto,
          status: createCourseDto.status ?? CourseStatus.ACTIVE,
          prerequisites: createCourseDto.prerequisites ?? [],
          prestudy: createCourseDto.prestudy ?? [],
          corequisites: createCourseDto.corequisites ?? [],
          category: createCourseDto.category ?? 'CORE',
          majorsSupported: createCourseDto.majorsSupported,
          majorCodesSupported: createCourseDto.majorCodesSupported,
          applicableSpecializations: createCourseDto.applicableSpecializations,
        },
      })

      await this.validateAndSyncConditions(tx, created.code, {
        prerequisites: createCourseDto.prerequisites ?? [],
        prestudy: createCourseDto.prestudy ?? [],
        corequisites: createCourseDto.corequisites ?? [],
      })

      await appendAuditLog(tx, actor, 'CREATE_COURSE', created.id, 'SUCCESS', `Created course ${created.code}.`)

      return created
    })

    return this.findOne(course.id)
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, actor: AuditActor) {
    const currentCourse = await this.prisma.course.findUnique({ where: { id } })
    if (!currentCourse) {
      throw new NotFoundException('Course not found.')
    }

    if (updateCourseDto.code && updateCourseDto.code !== currentCourse.code) {
      await this.assertUniqueCode(updateCourseDto.code, id)
    }

    const course = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.course.update({
        where: { id },
        data: {
          ...updateCourseDto,
          prerequisites: updateCourseDto.prerequisites,
          prestudy: updateCourseDto.prestudy,
          corequisites: updateCourseDto.corequisites,
          majorsSupported: updateCourseDto.majorsSupported,
          majorCodesSupported: updateCourseDto.majorCodesSupported,
          applicableSpecializations: updateCourseDto.applicableSpecializations,
        },
      })

      if (
        updateCourseDto.prerequisites !== undefined ||
        updateCourseDto.prestudy !== undefined ||
        updateCourseDto.corequisites !== undefined
      ) {
        await this.validateAndSyncConditions(tx, updated.code, {
          prerequisites: updateCourseDto.prerequisites ?? this.stringArray(currentCourse.prerequisites),
          prestudy: updateCourseDto.prestudy ?? this.stringArray(currentCourse.prestudy),
          corequisites: updateCourseDto.corequisites ?? this.stringArray(currentCourse.corequisites),
        })
      }

      await appendAuditLog(tx, actor, 'UPDATE_COURSE', updated.id, 'SUCCESS', `Updated course ${updated.code}.`)

      return updated
    })

    return this.findOne(course.id)
  }

  async remove(id: string, actor: AuditActor) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: CourseStatus.INACTIVE },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'DEACTIVATE_COURSE',
      course.id,
      'WARNING',
      `Deactivated course ${course.code}.`,
    )

    return course
  }
}
