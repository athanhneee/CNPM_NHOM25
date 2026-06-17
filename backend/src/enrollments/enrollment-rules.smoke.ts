import { strict as assert } from 'assert'
import { EnrollmentStatus } from '@prisma/client'
import {
  evaluateEnrollmentEligibility,
  RuleSettings,
  parseWeeks,
  weeksOverlap,
  checkScheduleConflict,
  RuleSection,
} from './enrollment-rules'
import { countSectionEnrollmentStatuses } from './enrollments.service'

const settings: RuleSettings = {
  simulationNow: '2026-04-10T00:00:00.000Z',
  registrationStart: '2026-04-01T00:00:00.000Z',
  registrationEnd: '2026-04-30T23:59:59.999Z',
  adjustmentStart: '2026-05-01T00:00:00.000Z',
  adjustmentEnd: '2026-05-10T23:59:59.999Z',
  withdrawalDeadline: '2026-05-20T23:59:59.999Z',
  maxCreditsMain: 24,
  maxCreditsSummer: 12,
  allowGradeImprovement: true,
  maxRetakeAttempts: 3,
  maxClassesPerDay: 4,
  maxClassesPerSemester: 8,
  allowWaitlist: true,
  countWaitlistCredits: false,
  semesterType: 'MAIN',
  currentSemesterId: 'semester-1',
}

const student = { id: 'student-1', roles: ['STUDENT'], status: 'ACTIVE' }
const course = { code: 'CSE101', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
const openSection: RuleSection = {
  id: 'section-1',
  courseCode: 'CSE101',
  semesterId: 'semester-1',
  weekday: 2,
  startPeriod: 1,
  periodCount: 3,
  weeks: '1-15',
  capacity: 2,
  registeredCount: 1,
  allowWaitlist: true,
  status: 'OPEN',
}

// === Original tests (with weeks field added) ===

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
const conflictSection: RuleSection = { ...openSection, id: 'section-2', courseCode: 'CSE102', startPeriod: 2 }

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

const duplicateCourseSection: RuleSection = { ...openSection, id: 'section-3', weekday: 4 }
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

// Test: Credit limit (Main)
const defaultContext = {
  student,
  section: openSection,
  targetCourse: course,
  courses: [course],
  sections: [openSection],
  enrollments: [],
  settings: { ...settings },
  studentResults: [],
}

const resultCreditLimit = evaluateEnrollmentEligibility({
  ...defaultContext,
  settings: { ...settings, maxCreditsMain: 2 },
})
assert.equal(resultCreditLimit.canRegister, false)
assert.equal(resultCreditLimit.errorCode, 'REG_ERR_CREDIT_LIMIT_EXCEEDED')

// Test: Summer limit
const resultSummerLimit = evaluateEnrollmentEligibility({
  ...defaultContext,
  settings: { ...settings, semesterType: 'SUMMER', maxCreditsSummer: 2 },
})
assert.equal(resultSummerLimit.canRegister, false)
assert.equal(resultSummerLimit.errorCode, 'REG_ERR_CREDIT_LIMIT_EXCEEDED')

// Test: Summer within limit
const resultSummerOk = evaluateEnrollmentEligibility({
  ...defaultContext,
  settings: { ...settings, semesterType: 'SUMMER', maxCreditsSummer: 5 },
})
assert.equal(resultSummerOk.canRegister, true)

// Test: Retake allowed and flagged
const resultRetake = evaluateEnrollmentEligibility({
  ...defaultContext,
  studentResults: [{ studentId: 'student-1', courseCode: 'CSE101', status: 'FAILED', passed: false }],
})
assert.equal(resultRetake.canRegister, true)
assert.equal(resultRetake.isRetake, true)

// Test: Retake limit exceeded
const resultRetakeLimit = evaluateEnrollmentEligibility({
  ...defaultContext,
  studentResults: [
    { studentId: 'student-1', courseCode: 'CSE101', status: 'FAILED', passed: false },
    { studentId: 'student-1', courseCode: 'CSE101', status: 'FAILED', passed: false },
    { studentId: 'student-1', courseCode: 'CSE101', status: 'FAILED', passed: false },
  ],
})
assert.equal(resultRetakeLimit.canRegister, false)
assert.equal(resultRetakeLimit.errorCode, 'REG_ERR_MAX_RETAKE_EXCEEDED')

// Test: Improvement allowed and flagged
const resultImprovement = evaluateEnrollmentEligibility({
  ...defaultContext,
  studentResults: [{ studentId: 'student-1', courseCode: 'CSE101', status: 'PASSED', passed: true }],
})
assert.equal(resultImprovement.canRegister, true)
assert.equal(resultImprovement.isImprovement, true)

// Test: Improvement rejected if flag is off
const resultImprovementRejected = evaluateEnrollmentEligibility({
  ...defaultContext,
  studentResults: [{ studentId: 'student-1', courseCode: 'CSE101', status: 'PASSED', passed: true }],
  settings: { ...settings, allowGradeImprovement: false },
})
assert.equal(resultImprovementRejected.canRegister, false)
assert.equal(resultImprovementRejected.errorCode, 'REG_ERR_ALREADY_PASSED')

console.log('✓ Original enrollment rule smoke tests passed.')

// === parseWeeks tests ===

// Basic range
assert.deepEqual(parseWeeks('1-15'), new Set([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]))

// Comma-separated
assert.deepEqual(parseWeeks('1,3,5,7'), new Set([1,3,5,7]))

// Mixed range and comma
assert.deepEqual(parseWeeks('1-5,8-10'), new Set([1,2,3,4,5,8,9,10]))

// Whitespace trimming
assert.deepEqual(parseWeeks('  1 - 3 , 5 '), new Set([1,2,3,5]))

// Empty string returns empty set
assert.deepEqual(parseWeeks(''), new Set())
assert.deepEqual(parseWeeks('   '), new Set())

// Single number
assert.deepEqual(parseWeeks('7'), new Set([7]))

// Invalid format: non-numeric
assert.throws(() => parseWeeks('abc'), /Định dạng tuần không hợp lệ/)

// Invalid format: negative number
assert.throws(() => parseWeeks('-1'), /Định dạng tuần không hợp lệ/)

// Invalid format: zero
assert.throws(() => parseWeeks('0'), /Định dạng tuần không hợp lệ/)

// Invalid format: end < start
assert.throws(() => parseWeeks('10-5'), /Định dạng tuần không hợp lệ/)

// Invalid format: too many dashes
assert.throws(() => parseWeeks('1-2-3'), /Định dạng tuần không hợp lệ/)

// Invalid format: float
assert.throws(() => parseWeeks('1.5'), /Định dạng tuần không hợp lệ/)

console.log('✓ parseWeeks tests passed.')

// === weeksOverlap tests ===

// Overlapping ranges
assert.equal(weeksOverlap('1-10', '5-15'), true)

// Non-overlapping ranges
assert.equal(weeksOverlap('1-5', '6-10'), false)

// Empty weeks treated as "all weeks" → always overlaps
assert.equal(weeksOverlap('', '1-10'), true)
assert.equal(weeksOverlap('1-10', ''), true)

// Exact same range
assert.equal(weeksOverlap('1-5', '1-5'), true)

// Single shared week
assert.equal(weeksOverlap('1,3,5', '5,7,9'), true)

// No shared weeks
assert.equal(weeksOverlap('1,3,5', '2,4,6'), false)

console.log('✓ weeksOverlap tests passed.')

// === checkScheduleConflict tests ===

// Test 1: same weekday, same period, same weeks → conflict
{
  const candidate: RuleSection = {
    id: 'candidate', courseCode: 'C1', semesterId: 's1',
    weekday: 2, startPeriod: 1, periodCount: 3, weeks: '1-10',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const existing: RuleSection = {
    id: 'existing', courseCode: 'C2', semesterId: 's1',
    weekday: 2, startPeriod: 2, periodCount: 3, weeks: '1-10',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const result = checkScheduleConflict(candidate, [existing])
  assert.notEqual(result, null, 'Same weekday/period/weeks should conflict')
  assert.equal(result!.conflictSectionId, 'existing')
  assert.deepEqual(result!.overlappingWeeks, [1,2,3,4,5,6,7,8,9,10])
  console.log('✓ Test: same weekday/period/weeks → conflict')
}

// Test 2: same weekday, same period, different weeks → NO conflict
{
  const candidate: RuleSection = {
    id: 'candidate', courseCode: 'C1', semesterId: 's1',
    weekday: 2, startPeriod: 1, periodCount: 3, weeks: '1-5',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const existing: RuleSection = {
    id: 'existing', courseCode: 'C2', semesterId: 's1',
    weekday: 2, startPeriod: 2, periodCount: 3, weeks: '6-10',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const result = checkScheduleConflict(candidate, [existing])
  assert.equal(result, null, 'Same weekday/period but different weeks should NOT conflict')
  console.log('✓ Test: same weekday/period, different weeks → no conflict')
}

// Test 3: different weekday → NO conflict
{
  const candidate: RuleSection = {
    id: 'candidate', courseCode: 'C1', semesterId: 's1',
    weekday: 2, startPeriod: 1, periodCount: 3, weeks: '1-15',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const existing: RuleSection = {
    id: 'existing', courseCode: 'C2', semesterId: 's1',
    weekday: 4, startPeriod: 1, periodCount: 3, weeks: '1-15',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const result = checkScheduleConflict(candidate, [existing])
  assert.equal(result, null, 'Different weekday should NOT conflict')
  console.log('✓ Test: different weekday → no conflict')
}

// Test 4: adjacent non-overlapping periods → NO conflict
{
  const candidate: RuleSection = {
    id: 'candidate', courseCode: 'C1', semesterId: 's1',
    weekday: 2, startPeriod: 1, periodCount: 3, weeks: '1-15',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const existing: RuleSection = {
    id: 'existing', courseCode: 'C2', semesterId: 's1',
    weekday: 2, startPeriod: 4, periodCount: 3, weeks: '1-15',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const result = checkScheduleConflict(candidate, [existing])
  assert.equal(result, null, 'Adjacent periods (1-3 and 4-6) should NOT conflict')
  console.log('✓ Test: adjacent non-overlapping periods → no conflict')
}

// Test 5: partial week overlap
{
  const candidate: RuleSection = {
    id: 'candidate', courseCode: 'C1', semesterId: 's1',
    weekday: 3, startPeriod: 1, periodCount: 2, weeks: '1-8',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const existing: RuleSection = {
    id: 'existing', courseCode: 'C2', semesterId: 's1',
    weekday: 3, startPeriod: 1, periodCount: 2, weeks: '5-12',
    capacity: 30, registeredCount: 0, allowWaitlist: true, status: 'OPEN',
  }
  const result = checkScheduleConflict(candidate, [existing])
  assert.notEqual(result, null, 'Partial week overlap should conflict')
  assert.deepEqual(result!.overlappingWeeks, [5,6,7,8])
  console.log('✓ Test: partial week overlap → conflict with correct overlapping weeks')
}

// Test 6: evaluateEnrollmentEligibility allows registration when same period but different weeks
{
  const courseA = { code: 'CSE201', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
  const courseB = { code: 'CSE202', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
  const sectionA: RuleSection = {
    id: 'sec-A', courseCode: 'CSE201', semesterId: 'semester-1',
    weekday: 3, startPeriod: 1, periodCount: 3, weeks: '1-7',
    capacity: 30, registeredCount: 5, allowWaitlist: true, status: 'OPEN',
  }
  const sectionB: RuleSection = {
    id: 'sec-B', courseCode: 'CSE202', semesterId: 'semester-1',
    weekday: 3, startPeriod: 1, periodCount: 3, weeks: '8-15',
    capacity: 30, registeredCount: 5, allowWaitlist: true, status: 'OPEN',
  }

  const result = evaluateEnrollmentEligibility({
    student,
    section: sectionB,
    targetCourse: courseB,
    courses: [courseA, courseB],
    sections: [sectionA, sectionB],
    enrollments: [
      {
        id: 'enrollment-A',
        studentId: 'student-1',
        sectionId: 'sec-A',
        semesterId: 'semester-1',
        status: 'REGISTERED',
      },
    ],
    settings,
  })

  assert.equal(result.canRegister, true, 'Same period/weekday but different weeks should allow registration')
  console.log('✓ Test: evaluateEnrollmentEligibility allows same period/different weeks')
}

// Test 7: error message includes conflict details
{
  const courseA = { code: 'CSE301', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
  const courseB = { code: 'CSE302', credits: 3, prerequisites: [], prestudy: [], corequisites: [] }
  const sectionA: RuleSection = {
    id: 'sec-conflict-A', courseCode: 'CSE301', semesterId: 'semester-1',
    weekday: 4, startPeriod: 1, periodCount: 3, weeks: '1-10',
    capacity: 30, registeredCount: 5, allowWaitlist: true, status: 'OPEN',
  }
  const sectionB: RuleSection = {
    id: 'sec-conflict-B', courseCode: 'CSE302', semesterId: 'semester-1',
    weekday: 4, startPeriod: 2, periodCount: 3, weeks: '5-15',
    capacity: 30, registeredCount: 5, allowWaitlist: true, status: 'OPEN',
  }

  const result = evaluateEnrollmentEligibility({
    student,
    section: sectionB,
    targetCourse: courseB,
    courses: [courseA, courseB],
    sections: [sectionA, sectionB],
    enrollments: [
      {
        id: 'enrollment-conflict',
        studentId: 'student-1',
        sectionId: 'sec-conflict-A',
        semesterId: 'semester-1',
        status: 'REGISTERED',
      },
    ],
    settings,
  })

  assert.equal(result.canRegister, false)
  assert.equal(result.errorCode, 'REG_ERR_SCHEDULE_CONFLICT')
  assert.ok(result.message.includes('sec-conflict-A'), `Error message should include conflicting section ID, got: ${result.message}`)
  assert.ok(result.message.includes('Thứ 4'), `Error message should include weekday name, got: ${result.message}`)
  assert.ok(result.message.includes('tuần'), `Error message should include weeks info, got: ${result.message}`)
  console.log('✓ Test: conflict error message includes section, weekday, and weeks details')
}

console.log('\n✅ All enrollment rule smoke tests passed.')
