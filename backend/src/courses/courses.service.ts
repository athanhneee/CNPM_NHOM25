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

  private async assertUniqueCode(code: string, ignoredCourseId?: string) {
    const duplicate = await this.prisma.course.findFirst({
      where: {
        code,
        id: ignoredCourseId ? { not: ignoredCourseId } : undefined,
      },
    })

    if (duplicate) {
      throw new BadRequestException('Mã học phần đã tồn tại.')
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
        orderBy: { code: 'asc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.course.count({ where }),
    ])

    return query.page || query.limit ? paginated(items, total, page, limit) : items
  }

  async findOne(idOrCode: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode }],
      },
    })

    if (!course) {
      throw new NotFoundException('Không tìm thấy học phần.')
    }

    return course
  }

  async findByCode(code: string) {
    const course = await this.prisma.course.findUnique({ where: { code } })
    if (!course) {
      throw new NotFoundException('Không tìm thấy học phần.')
    }

    return course
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

    await appendAuditLog(
      this.prisma,
      actor,
      'CREATE_COURSE',
      course.id,
      'SUCCESS',
      `Thêm mới học phần ${course.code}.`,
    )

    return course
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, actor: AuditActor) {
    const currentCourse = await this.prisma.course.findUnique({ where: { id } })
    if (!currentCourse) {
      throw new NotFoundException('Không tìm thấy học phần.')
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

    await appendAuditLog(
      this.prisma,
      actor,
      'UPDATE_COURSE',
      course.id,
      'SUCCESS',
      `Cập nhật học phần ${course.code}.`,
    )

    return course
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
      `Vô hiệu hóa học phần ${course.code}.`,
    )

    return course
  }
}
