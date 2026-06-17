import type {
  DashboardAnnouncement,
  SemesterOption,
  SystemSettings,
} from '@/types/settings'
import type { WishRequest } from '@/types/course'

export const seedSemesters: SemesterOption[] = [
  {
    id: '2025-2026-1',
    label: 'Học kỳ 1 năm học 2025-2026',
    isCurrent: false,
    academicYear: '2025-2026',
    termCode: 'HK1',
    registrationStatus: 'COMPLETED',
    registrationStart: '2025-08-12T08:00:00+07:00',
    registrationEnd: '2025-08-24T23:59:59+07:00',
    adjustmentStart: '2025-08-25T08:00:00+07:00',
    adjustmentEnd: '2025-08-30T23:59:59+07:00',
  },
  {
    id: 'sem-2',
    label: 'Học kỳ 2, 2025-2026',
    termCode: 'HK2',
    type: 'MAIN',
    isCurrent: false,
    registrationStatus: 'COMPLETED',
  },
  {
    id: 'sem-1',
    label: 'Học kỳ hè 2026',
    termCode: 'HÈ',
    type: 'SUMMER',
    isCurrent: false,
    registrationStatus: 'OPEN',
    registrationStart: new Date('2026-06-01T00:00:00Z').toISOString(),
    registrationEnd: new Date('2026-06-15T23:59:59Z').toISOString(),
    adjustmentStart: new Date('2026-06-16T00:00:00Z').toISOString(),
    adjustmentEnd: new Date('2026-06-20T23:59:59Z').toISOString(),
  },
]

export const seedSettings: SystemSettings = {
  simulationNow: new Date('2026-06-05T08:00:00Z').toISOString(),
  registrationStart: new Date('2026-06-01T00:00:00Z').toISOString(),
  registrationEnd: new Date('2026-06-15T23:59:59Z').toISOString(),
  adjustmentStart: new Date('2026-06-16T00:00:00Z').toISOString(),
  adjustmentEnd: new Date('2026-06-20T23:59:59Z').toISOString(),
  withdrawalDeadline: new Date('2026-06-25T23:59:59Z').toISOString(),
  maxCreditsMain: 24,
  maxCreditsSummer: 12,
  minCredits: 12,
  maintenanceMode: false,
  allowWaitlist: true,
  countWaitlistCredits: false,
  allowGradeImprovement: true,
  maxRetakeAttempts: 3,
  sessionTimeoutMinutes: 30,
  warningBeforeLogoutSeconds: 90,
  maxClassesPerDay: 3,
  maxClassesPerSemester: 8,
  currentSemesterId: '2025-2026-2',
  maintenanceMessage:
    'Hệ thống đang ở chế độ bảo trì nên tạm thời khóa các thao tác ghi dữ liệu.',
}

export const seedAnnouncements: DashboardAnnouncement[] = [
  {
    id: 'ANN001',
    title: 'Đợt điều chỉnh học phần đang mở',
    tone: 'warning',
    description:
      'Sinh viên có thể hủy hoặc đổi lớp học phần trong đợt điều chỉnh đến hết ngày 31/03/2026.',
  },
  {
    id: 'ANN002',
    title: 'Danh mục lớp ATTT đã cập nhật',
    tone: 'info',
    description:
      'Phòng Đào tạo vừa bổ sung nhóm học phần An toàn mạng, Mật mã ứng dụng và Bảo mật ứng dụng web cho học kỳ 2.',
  },
  {
    id: 'ANN003',
    title: 'Xử lý danh sách chờ mỗi ngày',
    tone: 'success',
    description:
      'Các lớp có chỗ trống sẽ được xét chuyển từ danh sách chờ sang đăng ký chính thức vào 17:00 hằng ngày.',
  },
]

export const seedWishRequests: WishRequest[] = [
  {
    id: 'WISH001',
    studentId: 'N23DCCN001',
    semesterId: '2025-2026-2',
    courseCode: 'INT2208',
    preferredGroup: '02',
    reason: 'Cần lớp có lịch học buổi sáng để không trùng lịch làm đồ án nhóm.',
    createdAt: '2026-03-25T09:10:00+07:00',
    status: 'PENDING',
  },
  {
    id: 'WISH002',
    studentId: 'N23DCAT001',
    semesterId: '2025-2026-2',
    courseCode: 'SEC2301',
    preferredGroup: '02',
    reason: 'Muốn thêm nhóm thực hành phòng lab vì nhóm hiện tại đã đủ chỗ.',
    createdAt: '2026-03-24T15:20:00+07:00',
    status: 'REVIEWED',
  },
  {
    id: 'WISH003',
    studentId: 'N23DCCN177',
    semesterId: '2025-2026-2',
    courseCode: 'INT2301',
    preferredGroup: '01',
    reason: 'Đề nghị mở thêm ca tư vấn đồ án vào cuối tuần để nhóm hoàn thiện tiến độ.',
    createdAt: '2026-03-23T10:00:00+07:00',
    status: 'APPROVED',
  },
]
