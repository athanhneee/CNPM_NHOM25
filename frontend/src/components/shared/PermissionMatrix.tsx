import { ROLE_PERMISSIONS, type PermissionKey } from '@/app/config/permissions'
import type { UserRole } from '@/types/auth'

const roles = ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] as const satisfies readonly UserRole[]

const permissionLabels: Record<PermissionKey, string> = {
  'profile.view': 'Xem hồ sơ',
  'profile.edit': 'Cập nhật hồ sơ',
  'password.change': 'Đổi mật khẩu',
  'student.view': 'Tra cứu học phần',
  'student.register': 'Đăng ký học phần',
  'student.cancel': 'Hủy đăng ký',
  'student.withdraw': 'Rút học phần',
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

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Quyen</th>
            {roles.map((role) => (
              <th key={role} className="px-4 py-3 font-semibold">
                {role}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {permissionKeys.map((permission) => (
            <tr key={permission}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{permissionLabels[permission]}</p>
                <p className="text-sm text-slate-500">{permission}</p>
              </td>
              {roles.map((role) => (
                <td key={role} className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${ROLE_PERMISSIONS[role].includes(permission) ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {ROLE_PERMISSIONS[role].includes(permission) ? 'Có' : 'Không'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default PermissionMatrix

