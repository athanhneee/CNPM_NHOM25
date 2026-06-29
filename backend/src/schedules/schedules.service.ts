import { Injectable } from '@nestjs/common'
import { EnrollmentStatus, SectionStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  private async buildScheduleEntries(sectionIds: string[], enrollmentStatusBySection = new Map<string, EnrollmentStatus>()) {
    const sections = await this.prisma.section.findMany({
      where: { id: { in: sectionIds } },
      orderBy: [{ weekday: 'asc' }, { startPeriod: 'asc' }],
      include: {
        course: true,
        lecturer: true,
      },
    })

    return sections.map((section) => ({
      id: section.id,
      title: section.course.name,
      courseCode: section.courseCode,
      sectionCode: section.sectionCode,
      weekday: section.weekday,
      startPeriod: section.startPeriod,
      periodCount: section.periodCount,
      room: section.room,
      lecturerName: section.lecturer?.fullName ?? section.guestLecturer ?? 'Chưa phân công',
      weeks: section.weeks,
      enrollmentStatus: enrollmentStatusBySection.get(section.id),
      sectionStatus: section.status,
    }))
  }

  async findSemesterSchedule(semesterId: string) {
    return this.prisma.section.findMany({
      where: { semesterId, status: { not: SectionStatus.CANCELLED } },
      orderBy: [{ weekday: 'asc' }, { startPeriod: 'asc' }],
      include: {
        course: true,
        lecturer: true,
      },
    })
  }

  async getStudentSchedule(studentId: string, semesterId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        semesterId,
        status: EnrollmentStatus.REGISTERED,
      },
    })
    const statusBySection = new Map(enrollments.map((enrollment) => [enrollment.sectionId, enrollment.status]))
    return this.buildScheduleEntries(enrollments.map((enrollment) => enrollment.sectionId), statusBySection)
  }

  async getLecturerSchedule(lecturerId: string, semesterId: string) {
    const sections = await this.prisma.section.findMany({
      where: { lecturerId, semesterId, status: { not: SectionStatus.CANCELLED } },
      select: { id: true },
    })

    return this.buildScheduleEntries(sections.map((section) => section.id))
  }
}
