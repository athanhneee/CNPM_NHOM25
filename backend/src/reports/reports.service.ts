import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async getCurrentSemesterId(semesterId?: string) {
    if (semesterId) {
      return semesterId
    }

    const settings = await this.prisma.systemSetting.findUnique({ where: { id: 1 } })
    if (!settings) {
      throw new NotFoundException('Chưa cấu hình tham số hệ thống.')
    }

    return settings.currentSemesterId
  }

  async getRegistrationSummary(semesterId?: string) {
    const currentSemesterId = await this.getCurrentSemesterId(semesterId)
    const sections = await this.prisma.section.findMany({
      where: { semesterId: currentSemesterId },
      include: {
        course: true,
        lecturer: true,
      },
      orderBy: { sectionCode: 'asc' },
    })

    return sections.map((section) => ({
      id: section.id,
      sectionCode: section.sectionCode,
      courseCode: section.courseCode,
      courseName: section.course.name,
      lecturerName: section.lecturer.fullName,
      capacity: section.capacity,
      registeredCount: section.registeredCount,
      waitlistCount: section.waitlistCount,
      utilizationRate: section.capacity ? section.registeredCount / section.capacity : 0,
      status: section.status,
    }))
  }

  async getUtilizationStats(semesterId?: string) {
    const rows = await this.getRegistrationSummary(semesterId)
    const totalSections = rows.length
    const totalCapacity = rows.reduce((sum, row) => sum + row.capacity, 0)
    const totalRegistered = rows.reduce((sum, row) => sum + row.registeredCount, 0)
    const totalWaitlisted = rows.reduce((sum, row) => sum + row.waitlistCount, 0)
    const fullSections = rows.filter((row) => row.status === 'FULL').length

    return {
      totalSections,
      totalCapacity,
      totalRegistered,
      totalWaitlisted,
      averageUtilization: totalCapacity ? totalRegistered / totalCapacity : 0,
      fullSections,
    }
  }
}
