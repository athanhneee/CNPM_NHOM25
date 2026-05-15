import type { UserRole } from '@/types/auth'

export type PermissionKey =
  | 'profile.view'
  | 'profile.edit'
  | 'password.change'
  | 'student.view'
  | 'student.register'
  | 'student.cancel'
  | 'student.withdraw'
  | 'student.wish'
  | 'lecturer.view'
  | 'academic.manageCourses'
  | 'academic.manageSections'
  | 'academic.assignLecturer'
  | 'academic.manageRegistrations'
  | 'academic.manageWaitlist'
  | 'academic.manageWishes'
  | 'admin.manageUsers'
  | 'admin.manageRoles'
  | 'admin.manageSettings'
  | 'admin.manageWishes'
  | 'admin.viewLogs'

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  STUDENT: [
    'profile.view',
    'profile.edit',
    'password.change',
    'student.view',
    'student.register',
    'student.cancel',
    'student.withdraw',
    'student.wish',
  ],
  LECTURER: [
    'profile.view',
    'profile.edit',
    'password.change',
    'lecturer.view',
  ],
  ACADEMIC_OFFICE: [
    'profile.view',
    'profile.edit',
    'password.change',
    'academic.manageCourses',
    'academic.manageSections',
    'academic.assignLecturer',
    'academic.manageRegistrations',
    'academic.manageWaitlist',
    'academic.manageWishes',
  ],
  ADMIN: [
    'profile.view',
    'profile.edit',
    'password.change',
    'admin.manageUsers',
    'admin.manageRoles',
    'admin.manageSettings',
    'admin.manageWishes',
    'admin.viewLogs',
  ],
}

export const ROUTE_ROLE_ACCESS: Array<{
  path: string
  roles: UserRole[]
}> = [
  { path: '/', roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] },
  { path: '/profile', roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] },
  { path: '/change-password', roles: ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] },
  { path: '/student', roles: ['STUDENT'] },
  { path: '/lecturer', roles: ['LECTURER'] },
  { path: '/academic', roles: ['ACADEMIC_OFFICE'] },
  { path: '/admin', roles: ['ADMIN'] },
]

export function hasPermission(roles: UserRole[], permission: PermissionKey) {
  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission))
}

export function canAccessPath(roles: UserRole[], path: string) {
  if (path === '/login' || path === '/forbidden') {
    return true
  }

  const matchedRule = ROUTE_ROLE_ACCESS.find((rule) =>
    path === rule.path || path.startsWith(`${rule.path}/`),
  )

  if (!matchedRule) {
    return true
  }

  return roles.some((role) => matchedRule.roles.includes(role))
}
