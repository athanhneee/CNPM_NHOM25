import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, UserRole, WishStatus } from '@prisma/client'
import { RequestUser } from '../common/types/request-user'
import { appendAuditLog, buildActor } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateWishDto } from './dto/create-wish.dto'

const REVIEW_STATUSES: WishStatus[] = [
  WishStatus.REVIEWED,
  WishStatus.APPROVED,
  WishStatus.REJECTED,
  WishStatus.CANCELLED,
]

@Injectable()
export class WishesService {
  constructor(private prisma: PrismaService) {}

  private isPrivileged(user: RequestUser) {
    return user.roles.some((role) => role === UserRole.ADMIN || role === UserRole.ACADEMIC_OFFICE)
  }

  private assertCanReadStudent(user: RequestUser, studentId: string) {
    if (this.isPrivileged(user)) {
      return
    }

    if (user.roles.includes(UserRole.STUDENT) && user.userId === studentId) {
      return
    }

    throw new ForbiddenException('Bạn không có quyền truy cập nguyện vọng của sinh viên này.')
  }

  private async currentSemesterId() {
    const settings = await this.prisma.systemSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      throw new BadRequestException('Chưa cấu hình tham số hệ thống.')
    }

    return settings.currentSemesterId
  }

  private async resolveStudentId(user: RequestUser, requestedStudentId?: string) {
    if (this.isPrivileged(user)) {
      if (!requestedStudentId) {
        throw new BadRequestException('studentId is required when acting on behalf of a student.')
      }

      return requestedStudentId
    }

    if (user.roles.includes(UserRole.STUDENT)) {
      if (requestedStudentId && requestedStudentId !== user.userId) {
        throw new ForbiddenException('Sinh viên chỉ được gửi nguyện vọng cho chính mình.')
      }

      return user.userId
    }

    throw new ForbiddenException('Bạn không có quyền tạo nguyện vọng.')
  }

  private async assertStudentAndCourse(studentId: string, courseCode: string, semesterId: string) {
    const [student, course, semester] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: studentId } }),
      this.prisma.course.findUnique({ where: { code: courseCode } }),
      this.prisma.semesterOption.findUnique({ where: { id: semesterId } }),
    ])

    if (!student || !normalizeRoles(student.roles).includes(UserRole.STUDENT)) {
      throw new BadRequestException('Sinh viên không tồn tại hoặc tài khoản không có vai trò sinh viên.')
    }

    if (!course || course.status !== 'ACTIVE') {
      throw new BadRequestException('Học phần không tồn tại hoặc đã bị vô hiệu hóa.')
    }

    if (!semester) {
      throw new BadRequestException('Học kỳ không tồn tại.')
    }
  }

  async findAll(user: RequestUser, query: Record<string, any> = {}) {
    const where: Prisma.WishRequestWhereInput = {}

    if (this.isPrivileged(user)) {
      if (query.studentId) where.studentId = query.studentId
    } else {
      if (!user.roles.includes(UserRole.STUDENT)) {
        throw new ForbiddenException('Bạn không có quyền xem danh sách nguyện vọng.')
      }
      where.studentId = user.userId
    }

    if (query.semesterId) where.semesterId = query.semesterId
    if (query.courseCode) where.courseCode = query.courseCode
    if (query.status) where.status = query.status as WishStatus

    const { page, limit, skip, take } = parsePagination(query)
    const [items, total] = await this.prisma.$transaction([
      this.prisma.wishRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.page || query.limit ? skip : undefined,
        take: query.page || query.limit ? take : undefined,
      }),
      this.prisma.wishRequest.count({ where }),
    ])

    return query.page || query.limit ? paginated(items, total, page, limit) : items
  }

  async findOne(id: string, user: RequestUser) {
    const wish = await this.prisma.wishRequest.findUnique({ where: { id } })
    if (!wish) {
      throw new NotFoundException('Không tìm thấy nguyện vọng.')
    }

    this.assertCanReadStudent(user, wish.studentId)
    return wish
  }

  async create(user: RequestUser, body: CreateWishDto) {
    const studentId = await this.resolveStudentId(user, body.studentId)
    const semesterId = body.semesterId ?? (await this.currentSemesterId())
    await this.assertStudentAndCourse(studentId, body.courseCode, semesterId)

    const wish = await this.prisma.wishRequest.create({
      data: {
        studentId,
        semesterId,
        courseCode: body.courseCode,
        preferredGroup: body.preferredGroup,
        reason: body.reason.trim(),
      },
    })

    await appendAuditLog(
      this.prisma,
      buildActor(user),
      'CREATE_WISH_REQUEST',
      wish.id,
      'SUCCESS',
      'Gửi nguyện vọng học phần thành công.',
      { courseCode: wish.courseCode, preferredGroup: wish.preferredGroup ?? null },
    )

    return wish
  }

  async cancel(id: string, user: RequestUser) {
    const wish = await this.findOne(id, user)

    if (wish.status !== WishStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể hủy nguyện vọng đang chờ xử lý.')
    }

    const updatedWish = await this.prisma.wishRequest.update({
      where: { id },
      data: { status: WishStatus.CANCELLED },
    })

    await appendAuditLog(this.prisma, buildActor(user), 'CANCEL_WISH_REQUEST', id, 'INFO', 'Hủy nguyện vọng học phần.')
    return updatedWish
  }

  async updateStatus(id: string, status: WishStatus, user: RequestUser) {
    if (!this.isPrivileged(user)) {
      throw new ForbiddenException('Chỉ quản trị hoặc phòng đào tạo được cập nhật trạng thái nguyện vọng.')
    }

    if (!REVIEW_STATUSES.includes(status)) {
      throw new BadRequestException('Trạng thái xử lý nguyện vọng không hợp lệ.')
    }

    const wish = await this.prisma.wishRequest.update({
      where: { id },
      data: { status },
    })

    await appendAuditLog(
      this.prisma,
      buildActor(user),
      'UPDATE_WISH_STATUS',
      id,
      status === WishStatus.REJECTED ? 'WARNING' : 'SUCCESS',
      `Cập nhật trạng thái nguyện vọng thành ${status}.`,
      { status },
    )

    return wish
  }
}
