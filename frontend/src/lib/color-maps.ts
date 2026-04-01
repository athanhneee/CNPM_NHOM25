import type { AccountStatus } from '@/types/auth'
import type { EnrollmentStatus } from '@/types/enrollment'
import type { SectionStatus } from '@/types/section'

export const enrollmentStatusMap: Record<
  EnrollmentStatus,
  { label: string; tooltip: string; className: string }
> = {
  PENDING: {
    label: 'Chờ xử lý',
    tooltip: 'Yêu cầu đăng ký đã được gửi và hệ thống đang kiểm tra.',
    className: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  REGISTERED: {
    label: 'Đăng ký thành công',
    tooltip: 'Sinh viên đã đăng ký thành công lớp học phần.',
    className: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  CANCELLED: {
    label: 'Đã hủy',
    tooltip: 'Sinh viên đã hủy đăng ký trong giai đoạn cho phép.',
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
  REJECTED: {
    label: 'Bị từ chối',
    tooltip: 'Yêu cầu bị từ chối do không đủ điều kiện hoặc lỗi nghiệp vụ.',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    tooltip: 'Sinh viên đã hoàn thành học phần.',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  FAILED: {
    label: 'Không đạt',
    tooltip: 'Sinh viên đã học nhưng không đạt học phần.',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  WAITLISTED: {
    label: 'Danh sách chờ',
    tooltip: 'Sinh viên đang ở hàng đợi vì lớp đã đủ sĩ số.',
    className: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  DROPPED: {
    label: 'Rút học phần',
    tooltip: 'Sinh viên rút học phần trước hạn withdrawal.',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
}

export const sectionStatusMap: Record<
  SectionStatus,
  { label: string; tooltip: string; className: string }
> = {
  OPEN: {
    label: 'Mở đăng ký',
    tooltip: 'Lớp học phần đang mở cho sinh viên đăng ký.',
    className: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  CLOSED: {
    label: 'Đóng đăng ký',
    tooltip: 'Lớp học phần đã đóng đăng ký.',
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
  FULL: {
    label: 'Đã đủ sĩ số',
    tooltip: 'Lớp học phần đã đủ số lượng sinh viên.',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  CANCELLED: {
    label: 'Lớp bị hủy',
    tooltip: 'Lớp học phần bị hủy bỏ.',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  IN_PROGRESS: {
    label: 'Đang diễn ra',
    tooltip: 'Lớp học phần đang trong giai đoạn giảng dạy.',
    className: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
  COMPLETED: {
    label: 'Đã kết thúc',
    tooltip: 'Lớp học phần đã kết thúc trong học kỳ.',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
}

export const accountStatusMap: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Hoạt động', className: 'bg-teal-50 text-teal-700 ring-teal-200' },
  LOCKED: { label: 'Bị khóa', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  INACTIVE: { label: 'Tạm ngưng', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
}
