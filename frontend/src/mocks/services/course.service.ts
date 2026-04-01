import { useDataStore } from '@/app/store/data.store'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { Course } from '@/types/course'
import type { UserRole } from '@/types/auth'

const defaultActor = { actorId: 'AO001', actorRole: 'ACADEMIC_OFFICE' as UserRole }

export const courseService = {
  async listCourses() {
    await sleep(getRandomDelay())
    return useDataStore.getState().courses
  },
  async getCourseById(courseId: string) {
    await sleep(120)
    return useDataStore.getState().courses.find((course) => course.id === courseId) ?? null
  },
  async createCourse(payload: Omit<Course, 'id'>, actor = defaultActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().createCourse(payload, actor)
  },
  async updateCourse(courseId: string, payload: Partial<Course>, actor = defaultActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().updateCourse(courseId, payload, actor)
  },
  async softDeleteCourse(courseId: string, actor = defaultActor) {
    await sleep(getRandomDelay())
    return useDataStore.getState().softDeleteCourse(courseId, actor)
  },
}
