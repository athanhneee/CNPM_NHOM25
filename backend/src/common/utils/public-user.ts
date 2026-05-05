import { UserRole } from '@prisma/client'

type UnsafeUserShape = {
  passwordDigest?: string
  refreshToken?: string | null
  roles?: unknown
  [key: string]: unknown
}

export function normalizeRoles(roles: unknown): UserRole[] {
  if (!Array.isArray(roles)) {
    return []
  }

  return roles.filter((role): role is UserRole =>
    Object.values(UserRole).includes(role as UserRole),
  )
}

export function primaryRole(roles: unknown): UserRole {
  return normalizeRoles(roles)[0] ?? UserRole.STUDENT
}

export function toPublicUser<T extends UnsafeUserShape | null | undefined>(user: T) {
  if (!user) {
    return user
  }

  const { passwordDigest, refreshToken, ...publicUser } = user
  return {
    ...publicUser,
    roles: normalizeRoles(user.roles),
  }
}

export function toPublicUsers<T extends UnsafeUserShape>(users: T[]) {
  return users.map((user) => toPublicUser(user))
}
