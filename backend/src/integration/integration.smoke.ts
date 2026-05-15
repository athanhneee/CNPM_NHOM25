import { strict as assert } from 'assert'
import { BadRequestException, UnauthorizedException } from '@nestjs/common'
import { AccountStatus, EnrollmentStatus, UserRole } from '@prisma/client'
import { seedDemoData } from '../../prisma/seed'
import { AuthService } from '../auth/auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { EnrollmentsService } from '../enrollments/enrollments.service'
import { SectionsService } from '../sections/sections.service'
import { UsersService } from '../users/users.service'

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
const ADMIN_ACTOR = { actorId: 'AD001', actorRole: UserRole.ADMIN }

async function assertUnauthorized(callback: () => Promise<unknown>) {
  await assert.rejects(callback, UnauthorizedException)
}

async function assertBadRequest(callback: () => Promise<unknown>) {
  await assert.rejects(callback, BadRequestException)
}

function configureTestEnvironment() {
  if (!TEST_DATABASE_URL) {
    console.log('Integration smoke tests skipped: TEST_DATABASE_URL is not configured.')
    return false
  }

  if (process.env.DATABASE_URL === TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be separate from DATABASE_URL because this test resets seed data.')
  }

  process.env.DATABASE_URL = TEST_DATABASE_URL
  process.env.DIRECT_URL = process.env.TEST_DIRECT_URL ?? TEST_DATABASE_URL
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'integration-smoke-secret'
  return true
}

async function createStudent(usersService: UsersService, code: string) {
  return usersService.create(
    {
      username: code,
      email: `${code.toLowerCase()}@student.ptithcm.edu.vn`,
      fullName: `Integration ${code}`,
      code,
      phone: '0909999999',
      roles: [UserRole.STUDENT],
      status: AccountStatus.ACTIVE,
      campus: 'PTIT HCM',
      department: 'CNTT',
      faculty: 'Cong nghe thong tin',
      majorCode: 'DCCN',
      majorName: 'Cong nghe phan mem',
      studentClass: 'D23CQCN99-N',
      password: 'ptithcm2026',
    },
    ADMIN_ACTOR,
  )
}

type RegisterResult = Awaited<ReturnType<EnrollmentsService['registerSection']>>

function getEnrollment(result: RegisterResult) {
  assert.equal(result.success, true)
  assert.ok('enrollment' in result && result.enrollment)
  return result.enrollment
}

async function main() {
  if (!configureTestEnvironment()) {
    return
  }

  const prisma = new PrismaService()
  await prisma.$connect()

  try {
    await seedDemoData(prisma, { reset: true })

    const authService = new AuthService(prisma)
    const usersService = new UsersService(prisma)
    const sectionsService = new SectionsService(prisma)
    const enrollmentsService = new EnrollmentsService(prisma)

    const login = await authService.login('N23DCCN001', 'ptithcm2026', false)
    assert.equal(login.success, true)
    assert.equal(login.user.id, 'N23DCCN001')

    await assertUnauthorized(() => authService.login('N23DCCN001', 'wrong-password', false))
    await usersService.setStatus('N23DCCN002', AccountStatus.LOCKED, ADMIN_ACTOR)
    await assertUnauthorized(() => authService.login('N23DCCN002', 'ptithcm2026', false))

    const createdUser = await createStudent(usersService, 'N23DCCN901')
    assert.equal(createdUser.username, 'N23DCCN901')
    const updatedUser = await usersService.update(
      createdUser.id,
      { phone: '0912345678', address: 'PTIT HCM' },
      ADMIN_ACTOR,
    )
    assert.equal(updatedUser.phone, '0912345678')
    assert.equal(updatedUser.address, 'PTIT HCM')

    await assertBadRequest(() =>
      sectionsService.create(
        {
          sectionCode: 'CSE101-CONFLICT',
          courseCode: 'CSE101',
          semesterId: 'sem-2026-1',
          group: '99',
          subGroup: '001',
          lecturerId: 'LEC001',
          room: 'A1-201',
          weekday: 2,
          startPeriod: 2,
          periodCount: 2,
          weeks: '1-15',
          capacity: 30,
          allowWaitlist: true,
          campus: 'PTIT HCM',
        },
        ADMIN_ACTOR,
      ),
    )

    const registeredStudent = await createStudent(usersService, 'N23DCCN902')
    const registered = await enrollmentsService.registerSection(
      registeredStudent.id,
      'sec-cse101-1',
      { actorId: registeredStudent.id, actorRole: UserRole.STUDENT },
    )
    const registeredEnrollment = getEnrollment(registered)
    assert.equal(registeredEnrollment.status, EnrollmentStatus.REGISTERED)

    const waitlistStudent = await createStudent(usersService, 'N23DCCN903')
    const waitlisted = await enrollmentsService.registerSection(
      waitlistStudent.id,
      'sec-cse101-full',
      { actorId: waitlistStudent.id, actorRole: UserRole.STUDENT },
    )
    const waitlistedEnrollment = getEnrollment(waitlisted)
    assert.equal(waitlistedEnrollment.status, EnrollmentStatus.WAITLISTED)

    await prisma.systemSetting.update({
      where: { id: 1 },
      data: { simulationNow: new Date('2026-05-02T08:00:00.000Z') },
    })
    const cancelled = await enrollmentsService.cancelEnrollment(
      registeredEnrollment.id,
      { actorId: registeredStudent.id, actorRole: UserRole.STUDENT },
      'Integration cancel',
    )
    assert.equal(cancelled.status, EnrollmentStatus.CANCELLED)

    await prisma.systemSetting.update({
      where: { id: 1 },
      data: { simulationNow: new Date('2026-04-10T08:00:00.000Z') },
    })
    const withdrawStudent = await createStudent(usersService, 'N23DCCN904')
    const withdrawRegistration = await enrollmentsService.registerSection(
      withdrawStudent.id,
      'sec-cse101-1',
      { actorId: withdrawStudent.id, actorRole: UserRole.STUDENT },
    )
    const withdrawEnrollment = getEnrollment(withdrawRegistration)
    assert.equal(withdrawEnrollment.status, EnrollmentStatus.REGISTERED)

    await prisma.systemSetting.update({
      where: { id: 1 },
      data: { simulationNow: new Date('2026-05-15T08:00:00.000Z') },
    })
    const withdrawn = await enrollmentsService.withdrawEnrollment(
      withdrawEnrollment.id,
      { actorId: withdrawStudent.id, actorRole: UserRole.STUDENT },
      'Integration withdraw',
    )
    assert.equal(withdrawn.status, EnrollmentStatus.DROPPED)

    console.log('Integration smoke tests passed.')
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
