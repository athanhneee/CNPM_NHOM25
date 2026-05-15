import { strict as assert } from 'assert'
import { EnrollmentStatus } from '@prisma/client'
import { summarizeSectionCancellation } from './sections.service'

const summary = summarizeSectionCancellation([
  { status: EnrollmentStatus.REGISTERED },
  { status: EnrollmentStatus.WAITLISTED },
  { status: EnrollmentStatus.PENDING },
  { status: EnrollmentStatus.COMPLETED },
  { status: EnrollmentStatus.DROPPED },
])

assert.equal(summary.cancelledEnrollmentCount, 3)
assert.equal(summary.registeredCancelled, 1)
assert.equal(summary.waitlistCancelled, 1)
assert.equal(summary.pendingCancelled, 1)

console.log('Section cancellation smoke tests passed.')
