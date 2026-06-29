import type { UserRole } from '@/types/auth'

export interface NavigationItem {
  label: string
  to: string
  icon: string
  roles: UserRole[]
  description: string
}

export interface NavigationGroup {
  title: string
  items: NavigationItem[]
}

export const navigationGroups: NavigationGroup[] = [
  {
    title: 'Chung',
    items: [
      {
        label: 'Bảng điều khiển',
        to: '/',
        icon: 'layout-dashboard',
        roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'],
        description: 'Trang tổng quan theo vai trò đang đăng nhập.',
      },
      {
        label: 'Thông tin cá nhân',
        to: '/profile',
        icon: 'user-round',
        roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'],
        description: 'Cập nhật thông tin cơ bản và trạng thái tài khoản.',
      },
      {
        label: 'Đổi mật khẩu',
        to: '/change-password',
        icon: 'key-round',
        roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'],
        description: 'Thay đổi mật khẩu cho tài khoản đang đăng nhập.',
      },
    ],
  },
  {
    title: 'Sinh viên',
    items: [
      {
        label: 'Học phần mở',
        to: '/student/open-sections',
        icon: 'book-open',
        roles: ['STUDENT'],
        description: 'Tra cứu lớp học phần đang mở trong học kỳ.',
      },
      {
        label: 'Đăng ký học phần',
        to: '/student/register',
        icon: 'clipboard-check',
        roles: ['STUDENT'],
        description: 'Kiểm tra điều kiện và đăng ký học phần.',
      },
      {
        label: 'Hủy đăng ký',
        to: '/student/cancel',
        icon: 'badge-minus',
        roles: ['STUDENT'],
        description: 'Hủy học phần trong thời gian đăng ký hoặc điều chỉnh.',
      },

      {
        label: 'TKB tuần',
        to: '/student/schedule/week',
        icon: 'calendar-days',
        roles: ['STUDENT'],
        description: 'Xem lịch học theo lưới thứ/tiết trong học kỳ.',
      },
      {
        label: 'TKB học kỳ',
        to: '/student/schedule/semester',
        icon: 'table-properties',
        roles: ['STUDENT'],
        description: 'Xem lịch học theo toàn bộ học kỳ.',
      },
      {
        label: 'Lịch sử đăng ký',
        to: '/student/history',
        icon: 'history',
        roles: ['STUDENT'],
        description: 'Tra cứu timeline và kết quả đăng ký.',
      },
      {
        label: 'Môn tiên quyết',
        to: '/student/prerequisites',
        icon: 'git-merge',
        roles: ['STUDENT'],
        description: 'Xem quan hệ tiên quyết, học trước và song hành.',
      },
      {
        label: 'Nguyện vọng',
        to: '/student/wish',
        icon: 'clipboard-list',
        roles: ['STUDENT'],
        description: 'Gửi nhu cầu mở thêm lớp hoặc đăng ký đặc biệt.',
      },
      {
        label: 'Kết quả đăng ký',
        to: '/student/registered',
        icon: 'list-checks',
        roles: ['STUDENT'],
        description: 'Tổng hợp học phần đăng ký và waitlist hiện tại.',
      },
    ],
  },
  {
    title: 'Giảng viên',
    items: [
      {
        label: 'Lớp được phân công',
        to: '/lecturer/sections',
        icon: 'graduation-cap',
        roles: ['LECTURER'],
        description: 'Danh sách lớp học phần đang phụ trách.',
      },
      {
        label: 'TKB tuần',
        to: '/lecturer/schedule/week',
        icon: 'calendar-range',
        roles: ['LECTURER'],
        description: 'Lịch giảng dạy theo lưới thứ/tiết trong học kỳ.',
      },
      {
        label: 'TKB học kỳ',
        to: '/lecturer/schedule/semester',
        icon: 'calendar-fold',
        roles: ['LECTURER'],
        description: 'Tổng hợp lịch giảng dạy cả học kỳ.',
      },
    ],
  },
  {
    title: 'Phòng đào tạo',
    items: [
      {
        label: 'Danh mục môn học',
        to: '/academic/courses',
        icon: 'book-copy',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Quản lý học phần, trạng thái và quan hệ học vụ.',
      },
      {
        label: 'Tạo lớp học phần',
        to: '/academic/sections/create',
        icon: 'plus-square',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Khởi tạo lớp học phần trong học kỳ.',
      },
      {
        label: 'Phân công giảng viên',
        to: '/academic/assign-lecturer',
        icon: 'users-round',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Gán giảng viên và kiểm tra xung đột lịch.',
      },
      {
        label: 'Quản lý đăng ký',
        to: '/academic/registrations',
        icon: 'file-clock',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Theo dõi sĩ số, đăng ký và điều chỉnh thông tin',
      },
      {
        label: 'Lịch học và phòng',
        to: '/academic/schedule-rooms',
        icon: 'map-pinned',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Cập nhật phòng học và lịch học phần.',
      },
      {
        label: 'Báo cáo',
        to: '/academic/reports',
        icon: 'chart-column-big',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Thống kê tỷ lệ lấp đầy, lớp full và nhóm báo cáo.',
      },
      {
        label: 'Danh sách chờ & can thiệp',
        to: '/academic/waitlist-override',
        icon: 'shield-plus',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Xử lý danh sách chờ và can thiệp đặc biệt.',
      },
      {
        label: 'Duyệt nguyện vọng',
        to: '/academic/wishes',
        icon: 'clipboard-list',
        roles: ['ACADEMIC_OFFICE'],
        description: 'Theo dõi và cập nhật trạng thái nguyện vọng học phần.',
      },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      {
        label: 'Tài khoản',
        to: '/admin/users',
        icon: 'user-cog',
        roles: ['ADMIN'],
        description: 'Tạo, khóa, mở khóa và đặt lại tài khoản.',
      },
      {
        label: 'Phân quyền',
        to: '/admin/roles',
        icon: 'shield-check',
        roles: ['ADMIN'],
        description: 'Gán vai trò và xem ma trận quyền hệ thống.',
      },
      {
        label: 'Tham số hệ thống',
        to: '/admin/settings',
        icon: 'sliders-horizontal',
        roles: ['ADMIN'],
        description: 'Điều chỉnh cửa sổ đăng ký, số tín chỉ tối đa và chế độ bảo trì.',
      },
      {
        label: 'Nhật ký hệ thống',
        to: '/admin/audit-logs',
        icon: 'logs',
        roles: ['ADMIN'],
        description: 'Theo dõi nhật ký hệ thống cho toàn bộ thao tác quan trọng.',
      },
      {
        label: 'Duyệt nguyện vọng',
        to: '/admin/wishes',
        icon: 'clipboard-list',
        roles: ['ADMIN'],
        description: 'Theo dõi và cập nhật trạng thái nguyện vọng học phần.',
      },
    ],
  },
]

export function getNavigationForRoles(roles: UserRole[]) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.some((role) => roles.includes(role))),
    }))
    .filter((group) => group.items.length > 0)
}
