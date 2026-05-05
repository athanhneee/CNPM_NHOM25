import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { toPublicUsers } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'

const DEFAULT_PASSWORD = 'ptithcm2026'

@Injectable()
export class SnapshotService {
  constructor(private prisma: PrismaService) {}

  async exportSnapshot() {
    const [users, courses, semesters, sections, enrollments, wishRequests, auditLogs, settings] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.course.findMany(),
      this.prisma.semesterOption.findMany(),
      this.prisma.section.findMany(),
      this.prisma.enrollment.findMany(),
      this.prisma.wishRequest.findMany(),
      this.prisma.auditLog.findMany(),
      this.prisma.systemSetting.findMany(),
    ])

    return {
      users: toPublicUsers(users),
      courses,
      semesters,
      sections,
      enrollments,
      wishRequests,
      auditLogs,
      settings,
    }
  }

  async importSnapshot(payload: any) {
    const defaultPasswordDigest = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const users = (payload.users ?? []).map((user: any) => ({
      ...user,
      passwordDigest: user.passwordDigest ?? defaultPasswordDigest,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    }))

    await this.prisma.$transaction([
      this.prisma.auditLog.deleteMany(),
      this.prisma.enrollment.deleteMany(),
      this.prisma.wishRequest.deleteMany(),
      this.prisma.section.deleteMany(),
      this.prisma.systemSetting.deleteMany(),
      this.prisma.course.deleteMany(),
      this.prisma.user.deleteMany(),
      this.prisma.semesterOption.deleteMany(),
    ])

    await this.prisma.$transaction([
      this.prisma.semesterOption.createMany({ data: payload.semesters ?? [] }),
      this.prisma.user.createMany({ data: users }),
      this.prisma.course.createMany({ data: payload.courses ?? [] }),
      this.prisma.systemSetting.createMany({ data: payload.settings ?? [] }),
      this.prisma.section.createMany({ data: payload.sections ?? [] }),
      this.prisma.enrollment.createMany({ data: payload.enrollments ?? [] }),
      this.prisma.wishRequest.createMany({ data: payload.wishRequests ?? [] }),
      this.prisma.auditLog.createMany({ data: payload.auditLogs ?? [] }),
    ])

    return { imported: true, defaultPassword: DEFAULT_PASSWORD }
  }

  async resetSeed() {
    await this.prisma.$transaction([
      this.prisma.auditLog.deleteMany(),
      this.prisma.enrollment.deleteMany(),
      this.prisma.wishRequest.deleteMany(),
      this.prisma.section.deleteMany(),
      this.prisma.systemSetting.deleteMany(),
      this.prisma.course.deleteMany(),
      this.prisma.user.deleteMany(),
      this.prisma.semesterOption.deleteMany(),
    ])
    return { reset: true, message: 'Dữ liệu đã được xóa. Chạy npm run prisma:seed để tạo lại dữ liệu demo.' }
  }
}
