import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetDatabase() {
  await prisma.auditLog.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.wishRequest.deleteMany()
  await prisma.section.deleteMany()
  await prisma.systemSetting.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  await prisma.semesterOption.deleteMany()
}

async function main() {
  await resetDatabase()

  const passwordDigest = await bcrypt.hash('ptithcm2026', 10)
  const currentSemesterId = 'sem-2026-1'
  const previousSemesterId = 'sem-2025-2'

  await prisma.semesterOption.createMany({
    data: [
      {
        id: previousSemesterId,
        label: 'Học kỳ 2025-2',
        isCurrent: false,
        academicYear: '2025-2026',
        termCode: 'HK2',
        registrationStatus: 'COMPLETED',
      },
      {
        id: currentSemesterId,
        label: 'Học kỳ 2026-1',
        isCurrent: true,
        academicYear: '2026-2027',
        termCode: 'HK1',
        registrationStatus: 'OPEN',
        registrationStart: new Date('2026-04-01T00:00:00.000Z'),
        registrationEnd: new Date('2026-04-30T23:59:59.999Z'),
        adjustmentStart: new Date('2026-05-01T00:00:00.000Z'),
        adjustmentEnd: new Date('2026-05-10T23:59:59.999Z'),
      },
    ],
  })

  await prisma.user.createMany({
    data: [
      {
        id: 'AD001',
        code: 'AD001',
        username: 'admin',
        email: 'admin@ptithcm.edu.vn',
        fullName: 'Quản trị hệ thống',
        phone: '0900000001',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'IT',
        passwordDigest,
      },
      {
        id: 'AO001',
        code: 'AO001',
        username: 'academic.office',
        email: 'academic.office@ptithcm.edu.vn',
        fullName: 'Phòng đào tạo',
        phone: '0900000002',
        roles: ['ACADEMIC_OFFICE'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'Academic Office',
        passwordDigest,
      },
      {
        id: 'LEC001',
        code: 'LEC001',
        username: 'minh.tuan',
        email: 'minh.tuan@ptithcm.edu.vn',
        fullName: 'Nguyễn Minh Tuấn',
        phone: '0900000003',
        roles: ['LECTURER'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'CNTT',
        faculty: 'Công nghệ thông tin',
        title: 'ThS.',
        position: 'Giảng viên',
        specialization: 'Công nghệ phần mềm',
        passwordDigest,
      },
      {
        id: 'LEC002',
        code: 'LEC002',
        username: 'thu.ha',
        email: 'thu.ha@ptithcm.edu.vn',
        fullName: 'Trần Thu Hà',
        phone: '0900000004',
        roles: ['LECTURER'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'CNTT',
        faculty: 'Công nghệ thông tin',
        title: 'TS.',
        position: 'Giảng viên',
        specialization: 'Hệ thống thông tin',
        passwordDigest,
      },
      {
        id: 'N23DCCN001',
        code: 'N23DCCN001',
        username: 'N23DCCN001',
        email: 'n23dccn001@student.ptithcm.edu.vn',
        fullName: 'Nguyễn Văn An',
        phone: '0911000001',
        roles: ['STUDENT'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'CNTT',
        faculty: 'Công nghệ thông tin',
        majorCode: 'DCCN',
        majorName: 'Công nghệ phần mềm',
        studentClass: 'D23CQCN01-N',
        studentStatus: 'Đang học',
        completedCredits: 24,
        gpa: 3.2,
        passwordDigest,
      },
      {
        id: 'N23DCCN002',
        code: 'N23DCCN002',
        username: 'N23DCCN002',
        email: 'n23dccn002@student.ptithcm.edu.vn',
        fullName: 'Lê Thị Bình',
        phone: '0911000002',
        roles: ['STUDENT'],
        status: 'ACTIVE',
        campus: 'PTIT HCM',
        department: 'CNTT',
        faculty: 'Công nghệ thông tin',
        majorCode: 'DCCN',
        majorName: 'Công nghệ phần mềm',
        studentClass: 'D23CQCN01-N',
        studentStatus: 'Đang học',
        completedCredits: 18,
        gpa: 3.0,
        passwordDigest,
      },
    ],
  })

  await prisma.course.createMany({
    data: [
      {
        id: 'course-cse101',
        code: 'CSE101',
        name: 'Lập trình cơ bản',
        credits: 3,
        status: 'ACTIVE',
        department: 'CNTT',
        campus: 'PTIT HCM',
        description: 'Nhập môn lập trình và tư duy thuật toán.',
        prerequisites: [],
        prestudy: [],
        corequisites: [],
        category: 'CORE',
        faculty: 'Công nghệ thông tin',
        courseType: 'Cơ sở ngành',
        suggestedSemester: 1,
      },
      {
        id: 'course-cse201',
        code: 'CSE201',
        name: 'Cấu trúc dữ liệu và giải thuật',
        credits: 3,
        status: 'ACTIVE',
        department: 'CNTT',
        campus: 'PTIT HCM',
        description: 'Các cấu trúc dữ liệu tuyến tính, cây, đồ thị và giải thuật cơ bản.',
        prerequisites: ['CSE101'],
        prestudy: [],
        corequisites: [],
        category: 'CORE',
        faculty: 'Công nghệ thông tin',
        courseType: 'Cơ sở ngành',
        suggestedSemester: 3,
      },
      {
        id: 'course-cse301',
        code: 'CSE301',
        name: 'Công nghệ phần mềm',
        credits: 3,
        status: 'ACTIVE',
        department: 'CNTT',
        campus: 'PTIT HCM',
        description: 'Quy trình, mô hình và kỹ thuật phát triển phần mềm.',
        prerequisites: ['CSE201'],
        prestudy: [],
        corequisites: [],
        category: 'CORE',
        faculty: 'Công nghệ thông tin',
        courseType: 'Chuyên ngành',
        suggestedSemester: 5,
      },
    ],
  })

  await prisma.section.createMany({
    data: [
      {
        id: 'sec-history-cse101',
        sectionCode: 'CSE101-HIS',
        courseCode: 'CSE101',
        semesterId: previousSemesterId,
        group: 'HIS',
        subGroup: '001',
        lecturerId: 'LEC001',
        room: 'A1-101',
        weekday: 2,
        startPeriod: 1,
        periodCount: 3,
        weeks: '1-15',
        capacity: 40,
        registeredCount: 1,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'COMPLETED',
        campus: 'PTIT HCM',
      },
      {
        id: 'sec-cse101-1',
        sectionCode: 'CSE101-1',
        courseCode: 'CSE101',
        semesterId: currentSemesterId,
        group: '01',
        subGroup: '001',
        lecturerId: 'LEC001',
        room: 'A1-201',
        weekday: 2,
        startPeriod: 1,
        periodCount: 3,
        weeks: '1-15',
        capacity: 40,
        registeredCount: 0,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'OPEN',
        campus: 'PTIT HCM',
      },
      {
        id: 'sec-cse101-full',
        sectionCode: 'CSE101-2',
        courseCode: 'CSE101',
        semesterId: currentSemesterId,
        group: '02',
        subGroup: '001',
        lecturerId: 'LEC002',
        room: 'A1-202',
        weekday: 3,
        startPeriod: 1,
        periodCount: 3,
        weeks: '1-15',
        capacity: 1,
        registeredCount: 1,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'FULL',
        campus: 'PTIT HCM',
      },
      {
        id: 'sec-cse201-1',
        sectionCode: 'CSE201-1',
        courseCode: 'CSE201',
        semesterId: currentSemesterId,
        group: '01',
        subGroup: '001',
        lecturerId: 'LEC001',
        room: 'A1-301',
        weekday: 4,
        startPeriod: 4,
        periodCount: 3,
        weeks: '1-15',
        capacity: 35,
        registeredCount: 1,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'OPEN',
        campus: 'PTIT HCM',
      },
    ],
  })

  await prisma.systemSetting.create({
    data: {
      id: 1,
      simulationNow: new Date('2026-04-10T08:00:00.000Z'),
      registrationStart: new Date('2026-04-01T00:00:00.000Z'),
      registrationEnd: new Date('2026-04-30T23:59:59.999Z'),
      adjustmentStart: new Date('2026-05-01T00:00:00.000Z'),
      adjustmentEnd: new Date('2026-05-10T23:59:59.999Z'),
      withdrawalDeadline: new Date('2026-05-20T23:59:59.999Z'),
      maxCredits: 24,
      minCredits: 12,
      maintenanceMode: false,
      allowWaitlist: true,
      sessionTimeoutMinutes: 30,
      warningBeforeLogoutSeconds: 60,
      maxClassesPerDay: 4,
      maxClassesPerSemester: 8,
      currentSemesterId,
      maintenanceMessage: 'Hệ thống đang hoạt động bình thường.',
    },
  })

  await prisma.enrollment.createMany({
    data: [
      {
        id: 'enr-history-cse101',
        studentId: 'N23DCCN001',
        sectionId: 'sec-history-cse101',
        semesterId: previousSemesterId,
        status: 'COMPLETED',
        timeline: [
          {
            status: 'COMPLETED',
            timestamp: '2026-01-15T00:00:00.000Z',
            actorId: 'AO001',
            actorRole: 'ACADEMIC_OFFICE',
            note: 'Hoàn thành học phần lịch sử để test tiên quyết.',
          },
        ],
      },
      {
        id: 'enr-current-cse201',
        studentId: 'N23DCCN001',
        sectionId: 'sec-cse201-1',
        semesterId: currentSemesterId,
        status: 'REGISTERED',
        timeline: [
          {
            status: 'REGISTERED',
            timestamp: '2026-04-10T08:00:00.000Z',
            actorId: 'N23DCCN001',
            actorRole: 'STUDENT',
            note: 'Đăng ký dữ liệu demo.',
          },
        ],
      },
      {
        id: 'enr-full-cse101',
        studentId: 'N23DCCN001',
        sectionId: 'sec-cse101-full',
        semesterId: currentSemesterId,
        status: 'REGISTERED',
        timeline: [
          {
            status: 'REGISTERED',
            timestamp: '2026-04-10T08:00:00.000Z',
            actorId: 'N23DCCN001',
            actorRole: 'STUDENT',
            note: 'Bản ghi làm đầy lớp để test waitlist.',
          },
        ],
      },
    ],
  })

  await prisma.auditLog.create({
    data: {
      id: 'log-seed',
      actorId: 'AD001',
      actorRole: 'ADMIN',
      action: 'SEED_INITIAL_DATA',
      targetId: 'SYSTEM',
      result: 'SUCCESS',
      message: 'Tạo dữ liệu demo ban đầu.',
      metadata: { defaultPassword: 'ptithcm2026' },
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
