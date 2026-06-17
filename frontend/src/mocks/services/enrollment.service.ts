import { useDataStore } from '@/app/store/data.store'
import { evaluateEnrollmentEligibility } from '@/lib/business-rules'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { UserRole } from '@/types/auth'

const studentActor = { actorId: 'N23DCCN001', actorRole: 'STUDENT' as UserRole }

export const enrollmentService = {
  async checkEligibility(studentId: string, sectionId: string) {
    await sleep(getRandomDelay())
    const snapshot = useDataStore.getState()
    const student = snapshot.users.find((user) => user.id === studentId)
    const section = snapshot.sections.find((item) => item.id === sectionId)
    const targetCourse = snapshot.courses.find((course) => course.code === section?.courseCode)

    return evaluateEnrollmentEligibility({
      nowIso: snapshot.settings.simulationNow,
      student,
      section,
      targetCourse,
      courses: snapshot.courses,
      sections: snapshot.sections,
      enrollments: snapshot.enrollments,
      settings: snapshot.settings,
    })
  },
  async registerSection(studentId: string, sectionId: string, actor = studentActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().registerStudentToSection(studentId, sectionId, actor)
  },
  async cancelEnrollment(enrollmentId: string, actor = studentActor, reason?: string) {
    await sleep(getRandomDelay())
    const enrollment = useDataStore.getState().cancelEnrollment(enrollmentId, actor, reason)
    return { enrollment, promoted: [], warnings: [] }
  },
  async withdrawEnrollment(enrollmentId: string, reason: string, actor = studentActor) {
    await sleep(getRandomDelay())
    const enrollment = useDataStore.getState().withdrawEnrollment(enrollmentId, actor, reason)
    return { enrollment, promoted: [], warnings: [] }
  },
  async listHistory(studentId: string) {
    await sleep(140)
    return useDataStore.getState().enrollments.filter((enrollment) => enrollment.studentId === studentId)
  },
  async listCurrentEnrollments(studentId: string, semesterId: string) {
    await sleep(140)
    return useDataStore
      .getState()
      .enrollments.filter(
        (enrollment) =>
          enrollment.studentId === studentId && enrollment.semesterId === semesterId,
      )
  },
  async processWaitlist(sectionId: string, actor = { actorId: 'AO001', actorRole: 'ACADEMIC_OFFICE' as UserRole }) {
    await sleep(getRandomDelay())
    return useDataStore.getState().processWaitlist(sectionId, actor)
  },
  async overrideEnrollment(
    studentId: string,
    sectionId: string,
    reason: string,
    actor = { actorId: 'AO001', actorRole: 'ACADEMIC_OFFICE' as UserRole },
  ) {
    await sleep(getRandomDelay())
    return useDataStore.getState().overrideEnrollment(studentId, sectionId, reason, actor)
  },
}
