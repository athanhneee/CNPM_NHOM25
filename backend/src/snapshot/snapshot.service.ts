import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import { seedDemoData } from '../../prisma/seed'
import { toPublicUsers } from '../common/utils/public-user'
import { PrismaService } from '../prisma/prisma.service'

const DEFAULT_PASSWORD = 'ptithcm2026'

@Injectable()
export class SnapshotService {
  constructor(private prisma: PrismaService) {}

  async exportSnapshot() {
    const [
      users,
      courses,
      semesters,
      rooms,
      courseConditions,
      studentResults,
      registrationErrorCodes,
      sections,
      enrollments,
      wishRequests,
      auditLogs,
      settings,
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.course.findMany(),
      this.prisma.semesterOption.findMany(),
      this.prisma.room.findMany(),
      this.prisma.courseCondition.findMany(),
      this.prisma.studentResult.findMany(),
      this.prisma.registrationErrorCode.findMany(),
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
      rooms,
      courseConditions,
      studentResults,
      registrationErrorCodes,
      sections,
      enrollments,
      wishRequests,
      auditLogs,
      settings,
    }
  }

  async importSnapshot(payload: any) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload import không hợp lệ.')
    }

    const requiredFields = ['users', 'courses', 'semesters', 'sections'] as const
    const missingFields = requiredFields.filter((field) => !Array.isArray(payload[field]))
    if (missingFields.length > 0) {
      throw new Error(`Thiếu dữ liệu bắt buộc: ${missingFields.join(', ')}.`)
    }

    const defaultPasswordDigest = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const users = (payload.users ?? []).map((user: any) => ({
      ...user,
      passwordDigest: user.passwordDigest ?? defaultPasswordDigest,
      refreshToken: null,
      refreshTokenExpiresAt: null,
    }))

    const semesters = payload.semesters ?? []
    const courses = payload.courses ?? []
    const rooms = payload.rooms ?? []
    const courseConditions = payload.courseConditions ?? []
    const registrationErrorCodes = payload.registrationErrorCodes ?? []
    const settings = payload.settings ?? []
    const sections = payload.sections ?? []
    const studentResults = payload.studentResults ?? []
    const enrollments = payload.enrollments ?? []
    const wishRequests = payload.wishRequests ?? []
    const auditLogs = payload.auditLogs ?? []

    await this.prisma.$transaction(async (tx) => {
      await tx.auditLog.deleteMany()
      await tx.enrollment.deleteMany()
      await tx.wishRequest.deleteMany()
      await tx.studentResult.deleteMany()
      await tx.section.deleteMany()
      await tx.courseCondition.deleteMany()
      await tx.registrationErrorCode.deleteMany()
      await tx.systemSetting.deleteMany()
      await tx.room.deleteMany()
      await tx.course.deleteMany()
      await tx.user.deleteMany()
      await tx.semesterOption.deleteMany()

      if (semesters.length) await tx.semesterOption.createMany({ data: semesters })
      if (users.length) await tx.user.createMany({ data: users })
      if (courses.length) await tx.course.createMany({ data: courses })
      if (rooms.length) await tx.room.createMany({ data: rooms })
      if (courseConditions.length) await tx.courseCondition.createMany({ data: courseConditions })
      if (registrationErrorCodes.length) await tx.registrationErrorCode.createMany({ data: registrationErrorCodes })
      if (settings.length) await tx.systemSetting.createMany({ data: settings })
      if (sections.length) await tx.section.createMany({ data: sections })
      if (studentResults.length) await tx.studentResult.createMany({ data: studentResults })
      if (enrollments.length) await tx.enrollment.createMany({ data: enrollments })
      if (wishRequests.length) await tx.wishRequest.createMany({ data: wishRequests })
      if (auditLogs.length) await tx.auditLog.createMany({ data: auditLogs })
    }, { timeout: 60000 })

    return {
      imported: true,
      defaultPassword: DEFAULT_PASSWORD,
      summary: {
        users: users.length,
        courses: courses.length,
        semesters: semesters.length,
        rooms: rooms.length,
        sections: sections.length,
        enrollments: enrollments.length,
        wishRequests: wishRequests.length,
        auditLogs: auditLogs.length,
      },
    }
  }

  async resetSeed() {
    await seedDemoData(this.prisma, { reset: true })
    return {
      reset: true,
      message: 'Dữ liệu demo đã được khởi tạo lại từ seed backend.',
      snapshot: await this.exportSnapshot(),
    }
  }
}
