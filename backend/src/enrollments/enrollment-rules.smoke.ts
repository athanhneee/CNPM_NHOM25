import { strict as assert } from 'assert'
import { EnrollmentStatus } from '@prisma/client'
import { evaluateEnrollmentEligibility, RuleSettings } from './enrollment-rules'
import { countSectionEnrollmentStatuses } from './enrollments.service'

const settings: RuleSettings = {
  simulationNow: '2026-04-10T00:00:00.000Z',
  registrationStart: '2026-04-01T00:00:00.000Z',
  registrationEnd: '2026-04-30T23:59:59.999Z',
  adjustmentStart: '2026-05-01T00:00:00.000Z',
  adjustmentEnd: '2026-05-10T23:59:59.999Z',
  withdrawalDeadline: '2026-05-20T23:59:59.999Z',
  maxCredits: 24,
  maxClassesPerDay: 4,
  maxClassesPerSemester: 8,
  allowWaitlist: true,
  currentSemesterId: 'semester-1',
}

const student = { id: 'student-1', roles: ['STUDENT'], status: 'ACTIVE' }
const course = { code: 'CSE101', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
const openSection = {
  id: 'section-1',
  courseCode: 'CSE101',
  semesterId: 'semester-1',
  weekday: 2,
  startPeriod: 1,
  periodCount: 3,
  capacity: 2,
  registeredCount: 1,
  allowWaitlist: true,
  status: 'OPEN',
}

const ok = evaluateEnrollmentEligibility({
  student,
  section: openSection,
  targetCourse: course,
  courses: [course],
  sections: [openSection],
  enrollments: [],
  settings,
})

assert.equal(ok.canRegister, true)
assert.equal(ok.finalStatus, 'REGISTERED')

const waitlisted = evaluateEnrollmentEligibility({
  student,
  section: { ...openSection, registeredCount: 2 },
  targetCourse: course,
  courses: [course],
  sections: [openSection],
  enrollments: [],
  settings,
})

assert.equal(waitlisted.canRegister, true)
assert.equal(waitlisted.finalStatus, 'WAITLISTED')

const conflictCourse = { code: 'CSE102', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
const conflictSection = { ...openSection, id: 'section-2', courseCode: 'CSE102', startPeriod: 2 }

const conflict = evaluateEnrollmentEligibility({
  student,
  section: conflictSection,
  targetCourse: conflictCourse,
  courses: [course, conflictCourse],
  sections: [openSection, conflictSection],
  enrollments: [
    {
      id: 'enrollment-1',
      studentId: 'student-1',
      sectionId: 'section-1',
      semesterId: 'semester-1',
      status: 'REGISTERED',
    },
  ],
  settings,
})

assert.equal(conflict.canRegister, false)
assert.equal(conflict.errorCode, 'REG_ERR_SCHEDULE_CONFLICT')

const duplicateCourseSection = { ...openSection, id: 'section-3', weekday: 4 }
const duplicateCourse = evaluateEnrollmentEligibility({
  student,
  section: duplicateCourseSection,
  targetCourse: course,
  courses: [course],
  sections: [openSection, duplicateCourseSection],
  enrollments: [
    {
      id: 'enrollment-1',
      studentId: 'student-1',
      sectionId: 'section-1',
      semesterId: 'semester-1',
      status: 'WAITLISTED',
    },
  ],
  settings,
})

assert.equal(duplicateCourse.canRegister, false)
assert.equal(duplicateCourse.errorCode, 'REG_ERR_ALREADY_REGISTERED_COURSE')

const counterSummary = countSectionEnrollmentStatuses([
  { status: EnrollmentStatus.REGISTERED },
  { status: EnrollmentStatus.WAITLISTED },
  { status: EnrollmentStatus.PENDING },
  { status: EnrollmentStatus.CANCELLED },
  { status: EnrollmentStatus.DROPPED },
])

assert.deepEqual(counterSummary, { registeredCount: 1, waitlistCount: 1 })

console.log('Enrollment rule smoke tests passed.')
