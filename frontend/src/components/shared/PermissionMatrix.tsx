import { ROLE_PERMISSIONS, type PermissionKey } from '@/app/config/permissions'
import type { UserRole } from '@/types/auth'
import { Table, type TableColumn } from '@/components/ui/Table'

const roles = ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] as const satisfies readonly UserRole[]

const roleLabels: Record<UserRole, string> = {
  STUDENT: 'Sinh viên',
  LECTURER: 'Giảng viên',
  ACADEMIC_OFFICE: 'Giáo vụ',
  ADMIN: 'Quản trị viên',
}

const permissionLabels: Record<PermissionKey, string> = {
  'profile.view': 'Xem hồ sơ',
  'profile.edit': 'Cập nhật hồ sơ',
  'password.change': 'Đổi mật khẩu',
  'student.view': 'Tra cứu học phần',
  'student.register': 'Đăng ký học phần',
  'student.cancel': 'Hủy đăng ký',
  'student.wish': 'Gửi nguyện vọng',
  'lecturer.view': 'Xem lớp phụ trách',
  'academic.manageCourses': 'Quản lý môn học',
  'academic.manageSections': 'Quản lý lớp học phần',
  'academic.assignLecturer': 'Phân công giảng viên',
  'academic.manageRegistrations': 'Quản lý đăng ký',
  'academic.manageWaitlist': 'Xử lý danh sách chờ',
  'academic.manageWishes': 'Duyệt nguyện vọng',
  'admin.manageUsers': 'Quản lý tài khoản',
  'admin.manageRoles': 'Phân quyền hệ thống',
  'admin.manageSettings': 'Cấu hình tham số',
  'admin.manageWishes': 'Duyệt nguyện vọng',
  'admin.viewLogs': 'Xem nhật ký hệ thống',
}

export function PermissionMatrix() {
  const permissionKeys = Object.keys(permissionLabels) as PermissionKey[]

  const columns: TableColumn<PermissionKey>[] = [
    {
      key: 'permission',
      header: 'Quyền hạn',
      render: (permission) => (
        <div>
          <p className="font-medium text-slate-900">{permissionLabels[permission]}</p>
          <p className="text-sm text-slate-500">{permission}</p>
        </div>
      ),
    },
    ...roles.map((role) => ({
      key: role,
      header: roleLabels[role],
      className: 'text-center',
      render: (permission: PermissionKey) => (
        <div className="flex justify-center">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${ROLE_PERMISSIONS[role].includes(permission) ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}
          >
            {ROLE_PERMISSIONS[role].includes(permission) ? 'Có' : 'Không'}
          </span>
        </div>
      ),
    })),
  ]

  return (
    <Table columns={columns} rows={permissionKeys} rowKey={(key) => key} pageSize={5} />
  )
}

export default PermissionMatrix

