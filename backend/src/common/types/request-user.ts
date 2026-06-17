import { UserRole } from '@prisma/client'

export interface RequestUser {
  sub: string
  userId: string
  username: string
  email: string
  roles: UserRole[]
}
