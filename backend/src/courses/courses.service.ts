import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { CourseStatus, Prisma } from '@prisma/client'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { PrismaService } from '../prisma/prisma.service'
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

  private async syncCourseConditions(
    courseCode: string,
    relations: {
      prerequisites?: string[]
      prestudy?: string[]
      corequisites?: string[]
    },
  ) {
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

    await this.prisma.$transaction([
      this.prisma.courseCondition.deleteMany({ where: { courseCode } }),
      ...(data.length ? [this.prisma.courseCondition.createMany({ data, skipDuplicates: true })] : []),
    ])
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

  async findAll(query: Record<string, any> = {}) {
    const where: Prisma.CourseWhereInput = {}
    if (query.department) where.department = query.department
    if (query.campus) where.campus = query.campus
    if (query.status) where.status = query.status as CourseStatus
    if (query.category) where.category = query.category
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

    const course = await this.prisma.course.create({
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

    await this.syncCourseConditions(course.code, {
      prerequisites: createCourseDto.prerequisites ?? [],
      prestudy: createCourseDto.prestudy ?? [],
      corequisites: createCourseDto.corequisites ?? [],
    })

    await appendAuditLog(this.prisma, actor, 'CREATE_COURSE', course.id, 'SUCCESS', `Created course ${course.code}.`)

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

    const course = await this.prisma.course.update({
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
      await this.syncCourseConditions(course.code, {
        prerequisites: updateCourseDto.prerequisites ?? this.stringArray(currentCourse.prerequisites),
        prestudy: updateCourseDto.prestudy ?? this.stringArray(currentCourse.prestudy),
        corequisites: updateCourseDto.corequisites ?? this.stringArray(currentCourse.corequisites),
      })
    }

    await appendAuditLog(this.prisma, actor, 'UPDATE_COURSE', course.id, 'SUCCESS', `Updated course ${course.code}.`)

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
