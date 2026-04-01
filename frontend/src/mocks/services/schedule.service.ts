import { useDataStore } from '@/app/store/data.store'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { ScheduleEntry } from '@/types/schedule'

function buildScheduleEntries(sectionIds: string[]) {
  const snapshot = useDataStore.getState()

  return snapshot.sections
    .filter((section) => sectionIds.includes(section.id))
    .map((section) => {
      const course = snapshot.courses.find((item) => item.code === section.courseCode)
      const lecturer = snapshot.users.find((user) => user.id === section.lecturerId)

      return {
        id: section.id,
        title: course?.name ?? section.sectionCode,
        courseCode: section.courseCode,
        sectionCode: section.sectionCode,
        weekday: section.weekday,
        startPeriod: section.startPeriod,
        periodCount: section.periodCount,
        room: section.room,
        lecturerName: lecturer?.fullName ?? 'Chua phan cong',
        weeks: section.weeks,
        sectionStatus: section.status,
      } satisfies ScheduleEntry
    })
  }

export const scheduleService = {
  async getStudentWeekSchedule(studentId: string, semesterId: string) {
    await sleep(getRandomDelay())
    const enrollments = useDataStore
      .getState()
      .enrollments.filter(
        (enrollment) =>
          enrollment.studentId === studentId &&
          enrollment.semesterId === semesterId &&
          enrollment.status === 'REGISTERED',
      )
    return buildScheduleEntries(enrollments.map((enrollment) => enrollment.sectionId))
  },
  async getStudentSemesterSchedule(studentId: string, semesterId: string) {
    return this.getStudentWeekSchedule(studentId, semesterId)
  },
  async getLecturerWeekSchedule(lecturerId: string, semesterId: string) {
    await sleep(getRandomDelay())
    const sections = useDataStore
      .getState()
      .sections.filter(
        (section) => section.lecturerId === lecturerId && section.semesterId === semesterId,
      )
    return buildScheduleEntries(sections.map((section) => section.id))
  },
  async getLecturerSemesterSchedule(lecturerId: string, semesterId: string) {
    return this.getLecturerWeekSchedule(lecturerId, semesterId)
  },
}
