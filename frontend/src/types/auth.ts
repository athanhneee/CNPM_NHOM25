export type UserRole =
  | 'STUDENT'
  | 'LECTURER'
  | 'ACADEMIC_OFFICE'
  | 'ADMIN'

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'INACTIVE' | 'DEFERRED' | 'SUSPENDED'

export interface AuthSession {
  userId: string
  expiresAt: string
  lastActivityAt: string
  rememberMe: boolean
}

export interface AuthCredentials {
  identifier: string
  password: string
  rememberMe: boolean
}

export interface AuthResult {
  session: AuthSession
  userId: string
}
