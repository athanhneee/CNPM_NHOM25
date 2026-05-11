import { strict as assert } from 'assert'
import { ForbiddenException } from '@nestjs/common'
import { SchedulesController } from './schedules.controller'

const service = {
  findSemesterSchedule: async () => [],
  getStudentSchedule: async () => [],
  getLecturerSchedule: async () => [],
}

const controller = new SchedulesController(service as any)

function user(userId: string, roles: Array<'STUDENT' | 'LECTURER' | 'ACADEMIC_OFFICE' | 'ADMIN'>) {
  return {
    sub: userId,
    userId,
    username: userId,
    email: `${userId}@example.test`,
    roles,
  }
}

async function assertForbidden(callback: () => Promise<unknown>) {
  await assert.rejects(callback, ForbiddenException)
}

async function main() {
  await controller.getStudentWeekSchedule(user('student-1', ['STUDENT']), 'student-1', 'semester-1')
  await assertForbidden(() =>
    controller.getStudentWeekSchedule(user('student-1', ['STUDENT']), 'student-2', 'semester-1'),
  )

  await controller.getLecturerWeekSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-1', 'semester-1')
  await assertForbidden(() =>
    controller.getLecturerWeekSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-2', 'semester-1'),
  )

  await controller.findSemesterSchedule(user('admin-1', ['ADMIN']), 'semester-1')
  await controller.findSemesterSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'semester-1')
  await assertForbidden(() => controller.findSemesterSchedule(user('student-1', ['STUDENT']), 'semester-1'))

  console.log('Schedule permission smoke tests passed.')
}

void main()
