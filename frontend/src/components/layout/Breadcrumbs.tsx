import { ChevronRight, House } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const segmentLabels: Record<string, string> = {
  profile: 'Thông tin cá nhân',
  'change-password': 'Đổi mật khẩu',
  student: 'Sinh viên',
  'open-sections': 'Học phần mở',
  register: 'Đăng ký học phần',
  cancel: 'Hủy đăng ký',
  schedule: 'Lịch học',
  week: 'Dạng tuần',
  semester: 'Dạng học kỳ',
  history: 'Lịch sử đăng ký',
  prerequisites: 'Môn tiên quyết',
  wish: 'Nguyện vọng',
  wishes: 'Duyệt nguyện vọng',
  registered: 'Kết quả đăng ký',
  lecturer: 'Giảng viên',
  sections: 'Lớp phân công',
  students: 'Danh sách sinh viên',
  academic: 'Phòng Đào tạo',
  courses: 'Danh mục môn học',
  create: 'Tạo lớp học phần',
  'assign-lecturer': 'Phân công giảng viên',
  registrations: 'Quản lý đăng ký',
  'schedule-rooms': 'Lịch học và phòng',
  reports: 'Báo cáo',
  'waitlist-override': 'Waitlist và Override',
  admin: 'Quản trị',
  users: 'Tài khoản người dùng',
  roles: 'Phân quyền',
  settings: 'Tham số hệ thống',
  'audit-logs': 'Nhật ký hệ thống',
  forbidden: '403',
}

export function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  if (!segments.length) {
    return null
  }

  const crumbs = segments.map((segment, index) => ({
    label: segmentLabels[segment] ?? segment.toUpperCase(),
    to: `/${segments.slice(0, index + 1).join('/')}`,
  }))

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <Link
        to="/"
        className="interactive-press inline-flex items-center gap-2 rounded-full bg-white/88 px-4 py-2 shadow-sm ring-1 ring-slate-200"
      >
        <House className="h-4 w-4" />
        Trang chủ
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.to} className="inline-flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          <Link to={crumb.to} className="interactive-press rounded-full px-3 py-1.5 hover:bg-white/80 hover:text-slate-700">
            {crumb.label}
          </Link>
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumbs
