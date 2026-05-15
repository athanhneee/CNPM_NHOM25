import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AccountStatus, Prisma, UserRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { paginated, parsePagination } from '../common/utils/pagination'
import { normalizeRoles, toPublicUser, toPublicUsers } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { ImportStudentCandidateDto } from './dto/import-students.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'

const DEFAULT_PASSWORD = 'ptithcm2026'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private async assertUniqueIdentity(username: string, email: string, ignoredUserId?: string) {
    const duplicate = await this.prisma.user.findFirst({
      where: {
        id: ignoredUserId ? { not: ignoredUserId } : undefined,
        OR: [{ username }, { email }],
      },
    })

    if (duplicate) {
      throw new BadRequestException('Username hoặc email đã tồn tại.')
    }
  }

  async findAll(query: UserQueryDto = {}) {
    const { page, limit, skip, take } = parsePagination(query)
    const where: Prisma.UserWhereInput = {}

    if (query.status) {
      where.status = query.status as AccountStatus
    }

    if (query.search) {
      const search = String(query.search).trim()
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { fullName: { contains: search } },
        { code: { contains: search } },
      ]
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { fullName: 'asc' },
    })

    const filtered = query.role
      ? users.filter((user) => normalizeRoles(user.roles).includes(query.role as UserRole))
      : users

    return query.page || query.limit
      ? paginated(toPublicUsers(filtered.slice(skip, skip + take)), filtered.length, page, limit)
      : toPublicUsers(filtered)
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.')
    }

    return toPublicUser(user)
  }

  async findByUsernameOrEmail(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    })
  }

  async create(createUserDto: CreateUserDto, actor: AuditActor) {
    await this.assertUniqueIdentity(createUserDto.username, createUserDto.email)

    const passwordDigest = await bcrypt.hash(createUserDto.password ?? DEFAULT_PASSWORD, 10)
    const createdUser = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        code: createUserDto.code,
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        roles: createUserDto.roles ?? [UserRole.STUDENT],
        status: createUserDto.status ?? AccountStatus.ACTIVE,
        passwordDigest,
        campus: createUserDto.campus,
        department: createUserDto.department,
        faculty: createUserDto.faculty,
        majorCode: createUserDto.majorCode,
        majorName: createUserDto.majorName,
        studentClass: createUserDto.studentClass,
        title: createUserDto.title,
        position: createUserDto.position,
        specialization: createUserDto.specialization,
      },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'CREATE_USER',
      createdUser.id,
      'SUCCESS',
      `Tạo mới tài khoản ${createdUser.username}.`,
    )

    return toPublicUser(createdUser)
  }

  async createStudentUser(payload: ImportStudentCandidateDto, actor: AuditActor) {
    const result = await this.importStudentUsers([payload], actor)
    const createdUser = result.created[0]
    if (!createdUser) {
      throw new BadRequestException(
        result.issues[0]?.message ?? result.skipped[0]?.reason ?? 'Không thể tạo sinh viên mới.',
      )
    }

    return createdUser
  }

  async importStudentUsers(payload: ImportStudentCandidateDto[], actor: AuditActor) {
    const passwordDigest = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const created: Array<ReturnType<typeof toPublicUser>> = []
    const skipped: Array<{ fullName: string; code: string; rowNumber?: number; reason: string }> = []
    const issues: Array<{ rowNumber?: number; message: string }> = []
    const batchCodes = new Set<string>()

    for (const candidate of payload) {
      const fullName = candidate.fullName.trim().replace(/\s+/g, ' ')
      const code = candidate.code.trim().toUpperCase()

      if (!fullName || !code) {
        issues.push({ rowNumber: candidate.rowNumber, message: 'Thiếu họ tên hoặc mã sinh viên.' })
        continue
      }

      if (batchCodes.has(code)) {
        skipped.push({ fullName, code, rowNumber: candidate.rowNumber, reason: 'Trùng mã sinh viên trong file nhập.' })
        continue
      }

      const email = `${code.toLowerCase()}@student.ptithcm.edu.vn`
      const duplicate = await this.prisma.user.findFirst({
        where: {
          OR: [{ code }, { username: code }, { email }],
        },
      })

      if (duplicate) {
        skipped.push({ fullName, code, rowNumber: candidate.rowNumber, reason: 'Mã sinh viên đã tồn tại.' })
        continue
      }

      const user = await this.prisma.user.create({
        data: {
          code,
          username: code,
          email,
          fullName,
          phone: '',
          roles: [UserRole.STUDENT],
          status: AccountStatus.ACTIVE,
          passwordDigest,
          campus: 'PTIT HCM',
          department: 'CNTT',
          faculty: 'Công nghệ thông tin',
          studentClass: code.slice(0, 7),
          studentStatus: 'Đang học',
        },
      })

      created.push(toPublicUser(user))
      batchCodes.add(code)
    }

    await appendAuditLog(
      this.prisma,
      actor,
      'IMPORT_STUDENTS',
      'users',
      created.length ? 'SUCCESS' : 'WARNING',
      created.length
        ? `Nhập ${created.length} sinh viên mới vào hệ thống.`
        : 'Không có sinh viên hợp lệ nào được thêm mới.',
      {
        createdCount: created.length,
        skippedCount: skipped.length,
        issueCount: issues.length,
      },
    )

    return { created, skipped, issues, defaultPassword: DEFAULT_PASSWORD }
  }

  async update(id: string, updateUserDto: UpdateUserDto, actor: AuditActor, allowSensitiveFields = true) {
    const currentUser = await this.prisma.user.findUnique({ where: { id } })
    if (!currentUser) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng.')
    }

    if (!allowSensitiveFields && (updateUserDto.roles || updateUserDto.status || updateUserDto.username)) {
      throw new ForbiddenException('Bạn không có quyền cập nhật role, trạng thái hoặc username.')
    }

    const nextUsername = updateUserDto.username ?? currentUser.username
    const nextEmail = updateUserDto.email ?? currentUser.email
    await this.assertUniqueIdentity(nextUsername, nextEmail, id)

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        username: updateUserDto.username,
        code: updateUserDto.code,
        fullName: updateUserDto.fullName,
        email: updateUserDto.email,
        phone: updateUserDto.phone,
        secondaryEmail: updateUserDto.secondaryEmail,
        address: updateUserDto.address,
        roles: allowSensitiveFields ? updateUserDto.roles : undefined,
        status: allowSensitiveFields ? updateUserDto.status : undefined,
        campus: updateUserDto.campus,
        department: updateUserDto.department,
        faculty: updateUserDto.faculty,
        majorCode: updateUserDto.majorCode,
        majorName: updateUserDto.majorName,
        studentClass: updateUserDto.studentClass,
        studentStatus: updateUserDto.studentStatus,
        title: updateUserDto.title,
        position: updateUserDto.position,
        specialization: updateUserDto.specialization,
        yearLevel: updateUserDto.yearLevel,
        gpa: updateUserDto.gpa,
        attendanceRate: updateUserDto.attendanceRate,
        completedCredits: updateUserDto.completedCredits,
        bio: updateUserDto.bio,
        avatarUrl: updateUserDto.avatarUrl,
      },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      'UPDATE_USER',
      id,
      'SUCCESS',
      `Cập nhật tài khoản ${updatedUser.username}.`,
    )

    return toPublicUser(updatedUser)
  }

  async setStatus(id: string, status: AccountStatus, actor: AuditActor) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status,
        failedLoginAttempts: status === AccountStatus.ACTIVE ? 0 : undefined,
        refreshToken: status === AccountStatus.ACTIVE ? undefined : null,
        refreshTokenExpiresAt: status === AccountStatus.ACTIVE ? undefined : null,
      },
    })

    await appendAuditLog(
      this.prisma,
      actor,
      status === AccountStatus.LOCKED ? 'LOCK_ACCOUNT' : 'SET_ACCOUNT_STATUS',
      id,
      status === AccountStatus.LOCKED ? 'WARNING' : 'SUCCESS',
      `Cập nhật trạng thái tài khoản thành ${status}.`,
      { status },
    )

    return toPublicUser(user)
  }

  async resetPassword(id: string, password: string, actor: AuditActor) {
    const passwordDigest = await bcrypt.hash(password, 10)
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        passwordDigest,
        failedLoginAttempts: 0,
        status: AccountStatus.ACTIVE,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    })

    await appendAuditLog(this.prisma, actor, 'RESET_PASSWORD', id, 'SUCCESS', 'Đặt lại mật khẩu tài khoản.')
    return toPublicUser(user)
  }

  async remove(id: string, actor: AuditActor) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        status: AccountStatus.INACTIVE,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    })

    await appendAuditLog(this.prisma, actor, 'DEACTIVATE_USER', id, 'WARNING', 'Vô hiệu hóa tài khoản.')
    return toPublicUser(user)
  }
}
