import type { Enrollment, EnrollmentStatus } from '@/types/enrollment'
import { createId } from '@/mocks/seed/ptit-helpers'

type ActorRole = 'STUDENT' | 'LECTURER' | 'ACADEMIC_OFFICE' | 'ADMIN'

interface EnrollmentSeedInput {
  studentId: string
  sectionId: string
  semesterId: string
  status: EnrollmentStatus
  createdAt: string
  updatedAt: string
  note: string
  actorId?: string
  actorRole?: ActorRole
  reasonCode?: string
  waitlistOrder?: number
  cancelledAt?: string
  droppedAt?: string
}

function buildTimelineItem(
  status: EnrollmentStatus,
  timestamp: string,
  note: string,
  actorId: string,
  actorRole: ActorRole,
) {
  return { status, timestamp, note, actorId, actorRole }
}

function buildEnrollment(input: EnrollmentSeedInput, index: number): Enrollment {
  const actorId = input.actorId ?? input.studentId
  const actorRole = input.actorRole ?? 'STUDENT'

  return {
    id: createId('ENR', index + 1),
    studentId: input.studentId,
    sectionId: input.sectionId,
    semesterId: input.semesterId,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    ...(input.reasonCode ? { reasonCode: input.reasonCode } : {}),
    ...(input.waitlistOrder ? { waitlistOrder: input.waitlistOrder } : {}),
    ...(input.cancelledAt ? { cancelledAt: input.cancelledAt } : {}),
    ...(input.droppedAt ? { droppedAt: input.droppedAt } : {}),
    timeline: [
      buildTimelineItem(input.status, input.updatedAt, input.note, actorId, actorRole),
    ],
  }
}

const cnttStudents = [
  'N23DCCN001',
  'N23DCCN019',
  'N23DCCN177',
  'N23DCCN138',
  'N23DCCN156',
  'N23DCCN025',
  'N23DCCN094',
  'N23DCCN044',
  'N23DCCN006',
  'N23DCCN026',
]

const atttStudents = [
  'N23DCAT001',
  'N23DCAT050',
  'N23DCAT003',
  'N23DCAT028',
  'N23DCAT053',
  'N22DCAT005',
  'N21DCAT024',
  'N23DCAT006',
]

const historySectionsCntt = ['SEC001', 'SEC003', 'SEC004', 'SEC005', 'SEC006', 'SEC007', 'SEC009']
const historySectionsAttt = ['SEC001', 'SEC003', 'SEC004', 'SEC005', 'SEC006', 'SEC007', 'SEC008', 'SEC009']

const historicalStatusOverrides: Record<string, Partial<Record<string, EnrollmentStatus>>> = {
  N23DCCN019: { SEC006: 'FAILED' },
  N23DCAT028: { SEC007: 'FAILED' },
}

const enrollmentSeeds: EnrollmentSeedInput[] = []

function pushHistoricalEnrollments(studentId: string, sectionIds: string[]) {
  sectionIds.forEach((sectionId, sectionIndex) => {
    const status = historicalStatusOverrides[studentId]?.[sectionId] ?? 'COMPLETED'
    enrollmentSeeds.push({
      studentId,
      sectionId,
      semesterId: '2025-2026-1',
      status,
      createdAt: `2025-08-${String(15 + (sectionIndex % 5)).padStart(2, '0')}T08:${String((sectionIndex * 7) % 60).padStart(2, '0')}:00+07:00`,
      updatedAt: `2025-12-${String(10 + (sectionIndex % 6)).padStart(2, '0')}T09:${String((sectionIndex * 5) % 60).padStart(2, '0')}:00+07:00`,
      note:
        status === 'FAILED'
          ? `Sinh viên chưa đạt học phần ${sectionId} trong học kỳ 1 năm học 2025-2026.`
          : `Sinh viên đã hoàn thành học phần ${sectionId} trong học kỳ 1 năm học 2025-2026.`,
    })
  })
}

cnttStudents.forEach((studentId) => pushHistoricalEnrollments(studentId, historySectionsCntt))
atttStudents.forEach((studentId) => pushHistoricalEnrollments(studentId, historySectionsAttt))

enrollmentSeeds.push(
  { studentId: 'N23DCCN001', sectionId: 'SEC101', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T08:00:00+07:00', updatedAt: '2026-03-20T08:00:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 01.' },
  { studentId: 'N23DCCN177', sectionId: 'SEC101', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T08:10:00+07:00', updatedAt: '2026-03-20T08:10:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 01.' },
  { studentId: 'N23DCCN138', sectionId: 'SEC101', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T08:20:00+07:00', updatedAt: '2026-03-20T08:20:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 01.' },
  { studentId: 'N23DCCN156', sectionId: 'SEC101', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T08:30:00+07:00', updatedAt: '2026-03-20T08:30:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 01.' },
  { studentId: 'N23DCCN025', sectionId: 'SEC101', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T08:40:00+07:00', updatedAt: '2026-03-20T08:40:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 01.' },

  { studentId: 'N23DCCN019', sectionId: 'SEC102', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T09:00:00+07:00', updatedAt: '2026-03-20T09:00:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 02.' },
  { studentId: 'N23DCCN094', sectionId: 'SEC102', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T09:10:00+07:00', updatedAt: '2026-03-20T09:10:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 02.' },
  { studentId: 'N23DCCN044', sectionId: 'SEC102', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T09:20:00+07:00', updatedAt: '2026-03-20T09:20:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 02.' },
  { studentId: 'N23DCCN006', sectionId: 'SEC102', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T09:30:00+07:00', updatedAt: '2026-03-20T09:30:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 02.' },
  { studentId: 'N23DCCN026', sectionId: 'SEC102', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-20T09:40:00+07:00', updatedAt: '2026-03-20T09:40:00+07:00', note: 'Đăng ký thành công Công nghệ phần mềm nhóm 02.' },

  { studentId: 'N23DCCN001', sectionId: 'SEC103', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T08:00:00+07:00', updatedAt: '2026-03-21T08:00:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 01.' },
  { studentId: 'N23DCCN177', sectionId: 'SEC103', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T08:10:00+07:00', updatedAt: '2026-03-21T08:10:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 01.' },
  { studentId: 'N23DCCN138', sectionId: 'SEC103', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T08:20:00+07:00', updatedAt: '2026-03-21T08:20:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 01.' },
  { studentId: 'N23DCCN025', sectionId: 'SEC103', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T08:30:00+07:00', updatedAt: '2026-03-21T08:30:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 01.' },

  { studentId: 'N23DCCN019', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T09:00:00+07:00', updatedAt: '2026-03-21T09:00:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 02.' },
  { studentId: 'N23DCCN094', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T09:10:00+07:00', updatedAt: '2026-03-21T09:10:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 02.' },
  { studentId: 'N23DCCN044', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T09:20:00+07:00', updatedAt: '2026-03-21T09:20:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 02.' },
  { studentId: 'N23DCCN006', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-21T09:30:00+07:00', updatedAt: '2026-03-21T09:30:00+07:00', note: 'Đăng ký thành công Phát triển ứng dụng web nhóm 02.' },
  { studentId: 'N23DCCN156', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-21T09:40:00+07:00', updatedAt: '2026-03-21T09:40:00+07:00', note: 'Lớp web nhóm 02 đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 1 },
  { studentId: 'N23DCCN026', sectionId: 'SEC104', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-21T09:50:00+07:00', updatedAt: '2026-03-21T09:50:00+07:00', note: 'Lớp web nhóm 02 đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 2 },

  { studentId: 'N23DCCN177', sectionId: 'SEC105', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T08:00:00+07:00', updatedAt: '2026-03-22T08:00:00+07:00', note: 'Đăng ký thành công Kiểm thử phần mềm.' },
  { studentId: 'N23DCCN138', sectionId: 'SEC105', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T08:10:00+07:00', updatedAt: '2026-03-22T08:10:00+07:00', note: 'Đăng ký thành công Kiểm thử phần mềm.' },
  { studentId: 'N23DCCN025', sectionId: 'SEC105', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T08:20:00+07:00', updatedAt: '2026-03-22T08:20:00+07:00', note: 'Đăng ký thành công Kiểm thử phần mềm.' },

  { studentId: 'N23DCCN001', sectionId: 'SEC106', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T09:00:00+07:00', updatedAt: '2026-03-22T09:00:00+07:00', note: 'Đăng ký thành công Quản lý dự án phần mềm.' },
  { studentId: 'N23DCCN019', sectionId: 'SEC106', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T09:10:00+07:00', updatedAt: '2026-03-22T09:10:00+07:00', note: 'Đăng ký thành công Quản lý dự án phần mềm.' },
  { studentId: 'N23DCCN177', sectionId: 'SEC106', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T09:20:00+07:00', updatedAt: '2026-03-22T09:20:00+07:00', note: 'Đăng ký thành công Quản lý dự án phần mềm.' },

  { studentId: 'N23DCCN094', sectionId: 'SEC107', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T10:00:00+07:00', updatedAt: '2026-03-22T10:00:00+07:00', note: 'Đăng ký thành công Điện toán đám mây.' },
  { studentId: 'N23DCCN044', sectionId: 'SEC107', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T10:10:00+07:00', updatedAt: '2026-03-22T10:10:00+07:00', note: 'Đăng ký thành công Điện toán đám mây.' },
  { studentId: 'N23DCCN006', sectionId: 'SEC107', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T10:20:00+07:00', updatedAt: '2026-03-22T10:20:00+07:00', note: 'Đăng ký thành công Điện toán đám mây.' },
  { studentId: 'N23DCCN026', sectionId: 'SEC107', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-22T10:30:00+07:00', updatedAt: '2026-03-22T10:30:00+07:00', note: 'Đăng ký thành công Điện toán đám mây.' },
  { studentId: 'N23DCCN001', sectionId: 'SEC107', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-22T10:40:00+07:00', updatedAt: '2026-03-22T10:40:00+07:00', note: 'Lớp Điện toán đám mây đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 1 },

  { studentId: 'N23DCCN145', sectionId: 'SEC108', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T08:00:00+07:00', updatedAt: '2026-03-23T08:00:00+07:00', note: 'Đăng ký học lại Cơ sở dữ liệu để cải thiện kết quả.' },
  { studentId: 'N23DCCN030', sectionId: 'SEC108', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T08:10:00+07:00', updatedAt: '2026-03-23T08:10:00+07:00', note: 'Đăng ký học lại Cơ sở dữ liệu để cải thiện kết quả.' },
  { studentId: 'N23DCAT001', sectionId: 'SEC109', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T08:20:00+07:00', updatedAt: '2026-03-23T08:20:00+07:00', note: 'Đăng ký lớp Mạng máy tính hỗ trợ nền tảng chuyên ngành ATTT.' },
  { studentId: 'N23DCAT050', sectionId: 'SEC109', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T08:30:00+07:00', updatedAt: '2026-03-23T08:30:00+07:00', note: 'Đăng ký lớp Mạng máy tính hỗ trợ nền tảng chuyên ngành ATTT.' },
  { studentId: 'N23DCAT003', sectionId: 'SEC109', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T08:40:00+07:00', updatedAt: '2026-03-23T08:40:00+07:00', note: 'Đăng ký lớp Mạng máy tính hỗ trợ nền tảng chuyên ngành ATTT.' },

  { studentId: 'N23DCAT001', sectionId: 'SEC110', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T09:00:00+07:00', updatedAt: '2026-03-23T09:00:00+07:00', note: 'Đăng ký thành công Nhập môn an toàn thông tin.' },
  { studentId: 'N23DCAT050', sectionId: 'SEC110', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T09:10:00+07:00', updatedAt: '2026-03-23T09:10:00+07:00', note: 'Đăng ký thành công Nhập môn an toàn thông tin.' },
  { studentId: 'N23DCAT003', sectionId: 'SEC110', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T09:20:00+07:00', updatedAt: '2026-03-23T09:20:00+07:00', note: 'Đăng ký thành công Nhập môn an toàn thông tin.' },
  { studentId: 'N23DCAT028', sectionId: 'SEC110', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T09:30:00+07:00', updatedAt: '2026-03-23T09:30:00+07:00', note: 'Đăng ký thành công Nhập môn an toàn thông tin.' },

  { studentId: 'N23DCAT001', sectionId: 'SEC111', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T10:00:00+07:00', updatedAt: '2026-03-23T10:00:00+07:00', note: 'Đăng ký thành công Mật mã ứng dụng.' },
  { studentId: 'N23DCAT050', sectionId: 'SEC111', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T10:10:00+07:00', updatedAt: '2026-03-23T10:10:00+07:00', note: 'Đăng ký thành công Mật mã ứng dụng.' },
  { studentId: 'N22DCAT005', sectionId: 'SEC111', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T10:20:00+07:00', updatedAt: '2026-03-23T10:20:00+07:00', note: 'Đăng ký thành công Mật mã ứng dụng.' },
  { studentId: 'N21DCAT024', sectionId: 'SEC111', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-23T10:30:00+07:00', updatedAt: '2026-03-23T10:30:00+07:00', note: 'Đăng ký thành công Mật mã ứng dụng.' },

  { studentId: 'N23DCAT053', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T08:00:00+07:00', updatedAt: '2026-03-24T08:00:00+07:00', note: 'Đăng ký thành công An toàn mạng.' },
  { studentId: 'N23DCAT006', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T08:10:00+07:00', updatedAt: '2026-03-24T08:10:00+07:00', note: 'Đăng ký thành công An toàn mạng.' },
  { studentId: 'N22DCAT005', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T08:20:00+07:00', updatedAt: '2026-03-24T08:20:00+07:00', note: 'Đăng ký thành công An toàn mạng.' },
  { studentId: 'N21DCAT024', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T08:30:00+07:00', updatedAt: '2026-03-24T08:30:00+07:00', note: 'Đăng ký thành công An toàn mạng.' },
  { studentId: 'N23DCAT001', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-24T08:40:00+07:00', updatedAt: '2026-03-24T08:40:00+07:00', note: 'Lớp An toàn mạng đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 1 },
  { studentId: 'N23DCAT028', sectionId: 'SEC112', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-24T08:50:00+07:00', updatedAt: '2026-03-24T08:50:00+07:00', note: 'Lớp An toàn mạng đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 2 },

  { studentId: 'N23DCAT050', sectionId: 'SEC113', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T09:10:00+07:00', updatedAt: '2026-03-24T09:10:00+07:00', note: 'Đăng ký thành công Bảo mật hệ điều hành.' },
  { studentId: 'N23DCAT003', sectionId: 'SEC113', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T09:20:00+07:00', updatedAt: '2026-03-24T09:20:00+07:00', note: 'Đăng ký thành công Bảo mật hệ điều hành.' },
  { studentId: 'N23DCAT028', sectionId: 'SEC113', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T09:30:00+07:00', updatedAt: '2026-03-24T09:30:00+07:00', note: 'Đăng ký thành công Bảo mật hệ điều hành.' },

  { studentId: 'N22DCAT005', sectionId: 'SEC114', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T10:00:00+07:00', updatedAt: '2026-03-24T10:00:00+07:00', note: 'Đăng ký thành công Kiểm thử xâm nhập.' },
  { studentId: 'N21DCAT024', sectionId: 'SEC114', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T10:10:00+07:00', updatedAt: '2026-03-24T10:10:00+07:00', note: 'Đăng ký thành công Kiểm thử xâm nhập.' },
  { studentId: 'N23DCAT053', sectionId: 'SEC114', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-24T10:20:00+07:00', updatedAt: '2026-03-24T10:20:00+07:00', note: 'Đăng ký thành công Kiểm thử xâm nhập.' },
  { studentId: 'N23DCAT006', sectionId: 'SEC114', semesterId: '2025-2026-2', status: 'WAITLISTED', createdAt: '2026-03-24T10:30:00+07:00', updatedAt: '2026-03-24T10:30:00+07:00', note: 'Lớp Kiểm thử xâm nhập đã đủ chỗ, sinh viên được đưa vào danh sách chờ.', waitlistOrder: 1 },

  { studentId: 'N23DCAT001', sectionId: 'SEC115', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T08:00:00+07:00', updatedAt: '2026-03-25T08:00:00+07:00', note: 'Đăng ký thành công Bảo mật ứng dụng web.' },
  { studentId: 'N23DCAT050', sectionId: 'SEC115', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T08:10:00+07:00', updatedAt: '2026-03-25T08:10:00+07:00', note: 'Đăng ký thành công Bảo mật ứng dụng web.' },

  { studentId: 'N23DCAT050', sectionId: 'SEC116', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T08:20:00+07:00', updatedAt: '2026-03-25T08:20:00+07:00', note: 'Đăng ký thành công Phân tích dữ liệu với Python.' },
  { studentId: 'N23DCCN177', sectionId: 'SEC117', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T08:30:00+07:00', updatedAt: '2026-03-25T08:30:00+07:00', note: 'Đăng ký thành công Thiết kế trải nghiệm người dùng.' },
  { studentId: 'N23DCAT053', sectionId: 'SEC120', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T08:40:00+07:00', updatedAt: '2026-03-25T08:40:00+07:00', note: 'Đăng ký thành công Chuyên đề doanh nghiệp PTIT.' },

  { studentId: 'N23DCCN019', sectionId: 'SEC118', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T09:00:00+07:00', updatedAt: '2026-03-25T09:00:00+07:00', note: 'Đăng ký thành công Đồ án chuyên ngành CNTT.' },
  { studentId: 'N23DCCN177', sectionId: 'SEC118', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T09:10:00+07:00', updatedAt: '2026-03-25T09:10:00+07:00', note: 'Đăng ký thành công Đồ án chuyên ngành CNTT.' },
  { studentId: 'N23DCCN138', sectionId: 'SEC118', semesterId: '2025-2026-2', status: 'REGISTERED', createdAt: '2026-03-25T09:20:00+07:00', updatedAt: '2026-03-25T09:20:00+07:00', note: 'Đăng ký thành công Đồ án chuyên ngành CNTT.' },

  { studentId: 'N23DCCN001', sectionId: 'SEC117', semesterId: '2025-2026-2', status: 'CANCELLED', createdAt: '2026-03-23T11:00:00+07:00', updatedAt: '2026-03-27T09:30:00+07:00', cancelledAt: '2026-03-27T09:30:00+07:00', note: 'Sinh viên hủy học phần tự chọn trong đợt điều chỉnh.' },
  { studentId: 'N23DCCN001', sectionId: 'SEC118', semesterId: '2025-2026-2', status: 'REJECTED', createdAt: '2026-03-26T08:00:00+07:00', updatedAt: '2026-03-26T08:00:00+07:00', note: 'Không đủ điều kiện tiên quyết để vào đồ án chuyên ngành CNTT.', reasonCode: 'REG_ERR_PREREQUISITE_NOT_MET' },
  { studentId: 'N23DCAT028', sectionId: 'SEC115', semesterId: '2025-2026-2', status: 'REJECTED', createdAt: '2026-03-26T08:10:00+07:00', updatedAt: '2026-03-26T08:10:00+07:00', note: 'Không đủ điều kiện học Bảo mật ứng dụng web vì thiếu học phần nền web.', reasonCode: 'REG_ERR_PREREQUISITE_NOT_MET' },
)

export const seedEnrollments: Enrollment[] = enrollmentSeeds.map((seed, index) =>
  buildEnrollment(seed, index),
)
