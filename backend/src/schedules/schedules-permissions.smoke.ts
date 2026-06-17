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
  // ── Student schedule ownership ──

  // Student A can view own schedule
  await controller.getStudentWeekSchedule(user('student-1', ['STUDENT']), 'student-1', 'semester-1')
  await controller.getStudentSemesterSchedule(user('student-1', ['STUDENT']), 'student-1', 'semester-1')

  // Student A CANNOT view Student B's schedule → 403
  await assertForbidden(() =>
    controller.getStudentWeekSchedule(user('student-1', ['STUDENT']), 'student-2', 'semester-1'),
  )
  await assertForbidden(() =>
    controller.getStudentSemesterSchedule(user('student-1', ['STUDENT']), 'student-2', 'semester-1'),
  )

  // Lecturer CANNOT view student schedule
  await assertForbidden(() =>
    controller.getStudentWeekSchedule(user('lecturer-1', ['LECTURER']), 'student-1', 'semester-1'),
  )
  await assertForbidden(() =>
    controller.getStudentSemesterSchedule(user('lecturer-1', ['LECTURER']), 'student-1', 'semester-1'),
  )

  console.log('✓ Student schedule ownership checks passed.')

  // ── Lecturer schedule ownership ──

  // Lecturer A can view own schedule
  await controller.getLecturerWeekSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-1', 'semester-1')
  await controller.getLecturerSemesterSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-1', 'semester-1')

  // Lecturer A CANNOT view Lecturer B's schedule → 403
  await assertForbidden(() =>
    controller.getLecturerWeekSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-2', 'semester-1'),
  )
  await assertForbidden(() =>
    controller.getLecturerSemesterSchedule(user('lecturer-1', ['LECTURER']), 'lecturer-2', 'semester-1'),
  )

  // Student CANNOT view lecturer schedule
  await assertForbidden(() =>
    controller.getLecturerWeekSchedule(user('student-1', ['STUDENT']), 'lecturer-1', 'semester-1'),
  )

  console.log('✓ Lecturer schedule ownership checks passed.')

  // ── ADMIN and ACADEMIC_OFFICE can view any schedule ──

  // ADMIN can view any student schedule
  await controller.getStudentWeekSchedule(user('admin-1', ['ADMIN']), 'student-1', 'semester-1')
  await controller.getStudentWeekSchedule(user('admin-1', ['ADMIN']), 'student-2', 'semester-1')
  await controller.getStudentSemesterSchedule(user('admin-1', ['ADMIN']), 'student-1', 'semester-1')

  // ADMIN can view any lecturer schedule
  await controller.getLecturerWeekSchedule(user('admin-1', ['ADMIN']), 'lecturer-1', 'semester-1')
  await controller.getLecturerWeekSchedule(user('admin-1', ['ADMIN']), 'lecturer-2', 'semester-1')
  await controller.getLecturerSemesterSchedule(user('admin-1', ['ADMIN']), 'lecturer-1', 'semester-1')

  // ACADEMIC_OFFICE can view any student schedule
  await controller.getStudentWeekSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'student-1', 'semester-1')
  await controller.getStudentSemesterSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'student-2', 'semester-1')

  // ACADEMIC_OFFICE can view any lecturer schedule
  await controller.getLecturerWeekSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'lecturer-1', 'semester-1')
  await controller.getLecturerSemesterSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'lecturer-2', 'semester-1')

  console.log('✓ ADMIN/ACADEMIC_OFFICE cross-user schedule access checks passed.')

  // ── Semester schedule (privileged only) ──

  await controller.findSemesterSchedule(user('admin-1', ['ADMIN']), 'semester-1')
  await controller.findSemesterSchedule(user('academic-1', ['ACADEMIC_OFFICE']), 'semester-1')
  await assertForbidden(() => controller.findSemesterSchedule(user('student-1', ['STUDENT']), 'semester-1'))
  await assertForbidden(() => controller.findSemesterSchedule(user('lecturer-1', ['LECTURER']), 'semester-1'))

  console.log('✓ Semester schedule privilege checks passed.')

  console.log('\n✅ All schedule permission smoke tests passed.')
}

void main()
