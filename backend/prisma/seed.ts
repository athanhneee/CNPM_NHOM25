import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

export async function resetDatabase(client: PrismaClient) {
  await client.auditLog.deleteMany()
  await client.enrollment.deleteMany()
  await client.wishRequest.deleteMany()
  await client.studentResult.deleteMany()
  await client.section.deleteMany()
  await client.courseCondition.deleteMany()
  await client.registrationErrorCode.deleteMany()
  await client.systemSetting.deleteMany()
  await client.room.deleteMany()
  await client.course.deleteMany()
  await client.user.deleteMany()
  await client.semesterOption.deleteMany()
}

export async function seedDemoData(client: PrismaClient, options: { reset?: boolean } = {}) {
  if (options.reset ?? true) {
    await resetDatabase(client)
  }

  const passwordDigest = await bcrypt.hash('ptithcm2026', 10)
  const currentSemesterId = 'sem-2026-1'
  const previousSemesterId = 'sem-2025-2'

  await client.semesterOption.createMany({
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
      {
        id: 'sem-2026-he',
        label: 'Học kỳ hè 2026',
        type: 'SUMMER',
        isCurrent: false,
        academicYear: '2026-2027',
        termCode: 'HÈ',
        registrationStatus: 'UPCOMING',
        registrationStart: new Date('2026-06-01T00:00:00.000Z'),
        registrationEnd: new Date('2026-06-15T23:59:59.999Z'),
        adjustmentStart: new Date('2026-06-16T00:00:00.000Z'),
        adjustmentEnd: new Date('2026-06-20T23:59:59.999Z'),
      },
    ],
  })

  await client.user.createMany({
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

  await client.course.createMany({
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
        id: 'course-cse150',
        code: 'CSE150',
        name: 'Cơ sở dữ liệu',
        credits: 3,
        status: 'ACTIVE',
        department: 'CNTT',
        campus: 'PTIT HCM',
        description: 'Mô hình dữ liệu quan hệ, SQL cơ bản và thiết kế cơ sở dữ liệu.',
        prerequisites: [],
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

  await client.room.createMany({
    data: [
      { id: 'room-a1-101', code: 'A1-101', name: 'A1-101', capacity: 40, campus: 'PTIT HCM' },
      { id: 'room-a1-201', code: 'A1-201', name: 'A1-201', capacity: 45, campus: 'PTIT HCM' },
      { id: 'room-a1-202', code: 'A1-202', name: 'A1-202', capacity: 45, campus: 'PTIT HCM' },
      { id: 'room-a1-301', code: 'A1-301', name: 'A1-301', capacity: 50, campus: 'PTIT HCM' },
    ],
  })

  await client.courseCondition.createMany({
    data: [
      {
        id: 'cond-cse201-cse101-prereq',
        courseCode: 'CSE201',
        requiredCourseCode: 'CSE101',
        type: 'PREREQUISITE',
        note: 'CSE101 is required before CSE201.',
      },
      {
        id: 'cond-cse301-cse201-prereq',
        courseCode: 'CSE301',
        requiredCourseCode: 'CSE201',
        type: 'PREREQUISITE',
        note: 'CSE201 is required before CSE301.',
      },
    ],
  })

  await client.registrationErrorCode.createMany({
    data: [
      { code: 'DK_TC', message: 'Đăng ký thành công.' },
      { code: 'HUY_DK', message: 'Đã hủy đăng ký.' },
      { code: 'KHONG_DU_DK', message: 'Không đủ điều kiện đăng ký.' },
      { code: 'NGOAI_TGDK', message: 'Ngoài thời gian đăng ký.' },
      { code: 'REG_ERR_SECTION_NOT_OPEN', message: 'Lớp học phần chưa mở đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_REGISTRATION_WINDOW', message: 'Ngoài thời gian đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW', message: 'Ngoài thời gian điều chỉnh đăng ký.' },
      { code: 'REG_ERR_OUTSIDE_WITHDRAWAL_WINDOW', message: 'Đã quá hạn rút học phần.' },
      { code: 'REG_ERR_FULL_CAPACITY', message: 'Lớp học phần đã đủ sĩ số.' },
      { code: 'REG_ERR_PREREQUISITE_NOT_MET', message: 'Chưa đạt môn tiên quyết.' },
      { code: 'REG_ERR_PRESTUDY_NOT_MET', message: 'Chưa đáp ứng môn học trước.' },
      { code: 'REG_ERR_COREQUISITE_NOT_MET', message: 'Chưa đáp ứng môn song hành.' },
      { code: 'REG_ERR_SCHEDULE_CONFLICT', message: 'Trùng thời khóa biểu.' },
      { code: 'REG_ERR_CREDIT_LIMIT_EXCEEDED', message: 'Vượt giới hạn tín chỉ.' },
      { code: 'REG_ERR_ALREADY_REGISTERED', message: 'Đã đăng ký lớp học phần này.' },
      { code: 'REG_ERR_ALREADY_REGISTERED_COURSE', message: 'Đã đăng ký hoặc vào danh sách chờ lớp khác của cùng học phần trong học kỳ này.' },
      { code: 'REG_ERR_CLASS_NOT_FOUND', message: 'Không tìm thấy lớp học phần.' },
      { code: 'REG_ERR_STUDENT_NOT_FOUND', message: 'Không tìm thấy sinh viên.' },
      { code: 'REG_ERR_CANNOT_WITHDRAW', message: 'Không thể hủy hoặc rút học phần này.' },
      { code: 'REG_ERR_CLASS_CANCELLED', message: 'Lớp học phần đã bị hủy.' },
      { code: 'REG_ERR_ACCOUNT_INACTIVE', message: 'Tài khoản không hoạt động.' },
      { code: 'REG_ERR_MAX_CLASS_PER_DAY', message: 'Vượt số lớp tối đa trong ngày.' },
      { code: 'REG_ERR_MAX_CLASS_PER_SEMESTER', message: 'Vượt số lớp tối đa trong học kỳ.' },
    ],
  })

  await client.section.createMany({
    data: [
      {
        id: 'sec-history-cse101',
        sectionCode: 'CSE101-HIS',
        courseCode: 'CSE101',
        semesterId: previousSemesterId,
        group: 'HIS',
        subGroup: '001',
        lecturerId: 'LEC001',
        roomId: 'room-a1-101',
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
        roomId: 'room-a1-201',
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
        roomId: 'room-a1-202',
        room: 'A1-202',
        weekday: 3,
        startPeriod: 1,
        periodCount: 3,
        weeks: '1-15',
        capacity: 1,
        registeredCount: 1,
        waitlistCount: 1,
        allowWaitlist: true,
        status: 'FULL',
        campus: 'PTIT HCM',
      },
      {
        id: 'sec-cse150-1',
        sectionCode: 'CSE150-1',
        courseCode: 'CSE150',
        semesterId: currentSemesterId,
        group: '01',
        subGroup: '001',
        lecturerId: 'LEC002',
        roomId: 'room-a1-202',
        room: 'A1-202',
        weekday: 5,
        startPeriod: 1,
        periodCount: 3,
        weeks: '1-15',
        capacity: 35,
        registeredCount: 0,
        waitlistCount: 0,
        allowWaitlist: true,
        status: 'OPEN',
        campus: 'PTIT HCM',
        notes: 'Lớp mở thêm để demo đăng ký thành công mà không đụng dữ liệu waitlist/tiên quyết.',
      },
      {
        id: 'sec-cse201-1',
        sectionCode: 'CSE201-1',
        courseCode: 'CSE201',
        semesterId: currentSemesterId,
        group: '01',
        subGroup: '001',
        lecturerId: 'LEC001',
        roomId: 'room-a1-301',
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

  await client.systemSetting.create({
    data: {
      id: 1,
      simulationNow: new Date('2026-04-10T08:00:00.000Z'),
      registrationStart: new Date('2026-04-01T00:00:00.000Z'),
      registrationEnd: new Date('2026-04-30T23:59:59.999Z'),
      adjustmentStart: new Date('2026-05-01T00:00:00.000Z'),
      adjustmentEnd: new Date('2026-05-10T23:59:59.999Z'),
      withdrawalDeadline: new Date('2026-05-20T23:59:59.999Z'),
      maxCreditsMain: 24,
      maxCreditsSummer: 12,
      minCredits: 12,
      maintenanceMode: false,
      allowWaitlist: true,
      countWaitlistCredits: false,
      allowGradeImprovement: true,
      maxRetakeAttempts: 3,
      sessionTimeoutMinutes: 30,
      warningBeforeLogoutSeconds: 60,
      maxClassesPerDay: 4,
      maxClassesPerSemester: 8,
      currentSemesterId,
      maintenanceMessage: 'Hệ thống đang hoạt động bình thường.',
    },
  })

  await client.studentResult.createMany({
    data: [
      {
        id: 'result-n23dccn001-cse101',
        studentId: 'N23DCCN001',
        courseCode: 'CSE101',
        semesterId: previousSemesterId,
        letterGrade: 'B+',
        numericGrade: 8.0,
        status: 'PASSED',
        passed: true,
      },
      {
        id: 'result-n23dccn001-cse150',
        studentId: 'N23DCCN001',
        courseCode: 'CSE150',
        semesterId: previousSemesterId,
        letterGrade: 'C',
        numericGrade: 6.0,
        status: 'PASSED',
        passed: true,
      },
      {
        id: 'result-n23dccn002-cse101',
        studentId: 'N23DCCN002',
        courseCode: 'CSE101',
        semesterId: previousSemesterId,
        letterGrade: 'F',
        numericGrade: 3.5,
        status: 'FAILED',
        passed: false,
      },
      {
        id: 'result-n23dccn002-cse150',
        studentId: 'N23DCCN002',
        courseCode: 'CSE150',
        semesterId: previousSemesterId,
        letterGrade: 'F',
        numericGrade: 3.0,
        status: 'FAILED',
        passed: false,
      },
    ],
  })

  await client.enrollment.createMany({
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
      {
        id: 'enr-waitlist-cse101',
        studentId: 'N23DCCN002',
        sectionId: 'sec-cse101-full',
        semesterId: currentSemesterId,
        status: 'WAITLISTED',
        waitlistOrder: 1,
        timeline: [
          {
            status: 'WAITLISTED',
            timestamp: '2026-04-10T08:10:00.000Z',
            actorId: 'N23DCCN002',
            actorRole: 'STUDENT',
            note: 'Lớp đã đủ sĩ số, sinh viên được đưa vào danh sách chờ.',
          },
        ],
      },
      {
        id: 'enr-cancelled-cse101',
        studentId: 'N23DCCN002',
        sectionId: 'sec-cse101-1',
        semesterId: currentSemesterId,
        status: 'CANCELLED',
        cancelledAt: new Date('2026-05-02T03:00:00.000Z'),
        reasonCode: 'Đổi kế hoạch học tập',
        timeline: [
          {
            status: 'CANCELLED',
            timestamp: '2026-05-02T03:00:00.000Z',
            actorId: 'N23DCCN002',
            actorRole: 'STUDENT',
            note: 'Hủy đăng ký trong cửa sổ điều chỉnh.',
          },
        ],
      },
      {
        id: 'enr-dropped-cse201',
        studentId: 'N23DCCN001',
        sectionId: 'sec-cse201-1',
        semesterId: currentSemesterId,
        status: 'DROPPED',
        droppedAt: new Date('2026-05-15T03:00:00.000Z'),
        reasonCode: 'Rút học phần để giảm tải tín chỉ',
        timeline: [
          {
            status: 'DROPPED',
            timestamp: '2026-05-15T03:00:00.000Z',
            actorId: 'N23DCCN001',
            actorRole: 'STUDENT',
            note: 'Rút học phần trước hạn rút.',
          },
        ],
      },
      {
        id: 'enr-rejected-cse201',
        studentId: 'N23DCCN002',
        sectionId: 'sec-cse201-1',
        semesterId: currentSemesterId,
        status: 'REJECTED',
        reasonCode: 'REG_ERR_PREREQUISITE_NOT_MET',
        timeline: [
          {
            status: 'REJECTED',
            timestamp: '2026-04-10T08:20:00.000Z',
            actorId: 'N23DCCN002',
            actorRole: 'STUDENT',
            note: 'Từ chối vì chưa đạt môn tiên quyết CSE101.',
          },
        ],
      },
    ],
  })

  await client.wishRequest.create({
    data: {
      id: 'wish-cse301-extra',
      studentId: 'N23DCCN001',
      semesterId: currentSemesterId,
      courseCode: 'CSE301',
      preferredGroup: '01',
      reason: 'Sinh viên có nhu cầu mở thêm lớp Công nghệ phần mềm để kịp tiến độ học tập.',
      status: 'PENDING',
    },
  })

  await client.auditLog.create({
    data: {
      id: 'log-seed',
      actorId: 'AD001',
      actorRole: 'ADMIN',
      action: 'SEED_INITIAL_DATA',
      targetId: 'SYSTEM',
      result: 'SUCCESS',
      message: 'Tạo dữ liệu demo ban đầu.',
      metadata: { seed: 'initial-demo-data' },
    },
  })
}

async function main() {
  const prisma = new PrismaClient()
  try {
    await seedDemoData(prisma, { reset: true })
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  void main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
