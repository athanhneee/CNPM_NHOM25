import {
  apiRequest,
  clearStoredAuth,
  getApiErrorMessage,
  readStoredAuth,
  type StoredAuthState,
  writeStoredAuth,
} from '@/lib/api-client'
import type { AccountStatus, AuthCredentials, AuthSession, UserRole } from '@/types/auth'
import type { AcademicRecords, User } from '@/types/user'

interface BackendUser {
  id: string
  username: string
  email: string
  fullName: string
  phone?: string | null
  secondaryEmail?: string | null
  roles: UserRole[]
  status: AccountStatus
  campus?: string | null
  department?: string | null
  code?: string | null
  failedLoginAttempts?: number | null
  lastLoginAt?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  citizenId?: string | null
  nationality?: string | null
  ethnicity?: string | null
  religion?: string | null
  birthPlace?: string | null
  address?: string | null
  homeTown?: string | null
  program?: string | null
  cohort?: string | null
  faculty?: string | null
  majorCode?: string | null
  majorName?: string | null
  studentClass?: string | null
  educationProgram?: string | null
  academicPeriod?: string | null
  studentStatus?: string | null
  classificationStatus?: 'MAPPED' | 'REVIEW' | null
  assignedSectionIds?: string[] | null
  title?: string | null
  position?: string | null
  specialization?: string | null
  yearLevel?: string | null
  gpa?: number | null
  attendanceRate?: number | null
  completedCredits?: number | null
  interests?: string[] | null
  bio?: string | null
  avatarUrl?: string | null
}

interface LoginResponse {
  success: boolean
  accessToken: string
  refreshToken: string
  session: AuthSession
  user: BackendUser
}

const PROFILE_MUTATION_FIELDS = [
  'email',
  'phone',
  'secondaryEmail',
  'address',
  'bio',
  'avatarUrl',
] as const satisfies readonly (keyof User)[]

function nullable(value: string | null | undefined) {
  return value ?? undefined
}

function normalizeUser(user: BackendUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone ?? '',
    secondaryEmail: nullable(user.secondaryEmail),
    roles: user.roles,
    status: user.status,
    campus: user.campus ?? '',
    department: user.department ?? '',
    code: user.code ?? user.username,
    passwordDigest: '',
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    lastLoginAt: nullable(user.lastLoginAt),
    dateOfBirth: nullable(user.dateOfBirth),
    gender: nullable(user.gender),
    citizenId: nullable(user.citizenId),
    nationality: nullable(user.nationality),
    ethnicity: nullable(user.ethnicity),
    religion: nullable(user.religion),
    birthPlace: nullable(user.birthPlace),
    address: nullable(user.address),
    homeTown: nullable(user.homeTown),
    program: nullable(user.program),
    cohort: nullable(user.cohort),
    faculty: nullable(user.faculty),
    majorCode: nullable(user.majorCode),
    majorName: nullable(user.majorName),
    studentClass: nullable(user.studentClass),
    educationProgram: nullable(user.educationProgram),
    academicPeriod: nullable(user.academicPeriod),
    studentStatus: nullable(user.studentStatus),
    classificationStatus: user.classificationStatus ?? undefined,
    assignedSectionIds: user.assignedSectionIds ?? undefined,
    title: nullable(user.title),
    position: nullable(user.position),
    specialization: nullable(user.specialization),
    yearLevel: nullable(user.yearLevel),
    gpa: user.gpa ?? undefined,
    attendanceRate: user.attendanceRate ?? undefined,
    completedCredits: user.completedCredits ?? undefined,
    interests: user.interests ?? undefined,
    bio: nullable(user.bio),
    avatarUrl: nullable(user.avatarUrl),
  } as User
}

function hasStoredAuthShape(value: ReturnType<typeof readStoredAuth>): value is StoredAuthState {
  return Boolean(
    value &&
      typeof value.accessToken === 'string' &&
      typeof value.refreshToken === 'string' &&
      value.session &&
      typeof value.session.expiresAt === 'string',
  )
}

function isExpired(session: AuthSession) {
  return new Date(session.expiresAt).getTime() <= Date.now()
}

function pickProfilePayload(payload: Partial<User>) {
  const nextPayload: Partial<Record<(typeof PROFILE_MUTATION_FIELDS)[number], unknown>> = {}

  PROFILE_MUTATION_FIELDS.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) {
      nextPayload[field] = value
    }
  })

  return nextPayload
}

export const authApiService = {
  async login(credentials: AuthCredentials) {
    try {
      const result = await apiRequest<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          auth: false,
          body: credentials,
        },
        false,
      )

      writeStoredAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        session: result.session,
      })

      return {
        success: true as const,
        user: normalizeUser(result.user),
        session: result.session,
      }
    } catch (error) {
      return {
        success: false as const,
        message: getApiErrorMessage(error, 'Đăng nhập không thành công.'),
      }
    }
  },

  async restoreSession() {
    const storedAuth = readStoredAuth()
    if (!hasStoredAuthShape(storedAuth) || isExpired(storedAuth.session)) {
      clearStoredAuth()
      return null
    }

    try {
      const user = await apiRequest<BackendUser>('/auth/me')
      const nextAuth = readStoredAuth()
      return {
        user: normalizeUser(user),
        session: nextAuth?.session ?? storedAuth.session,
      }
    } catch {
      clearStoredAuth()
      return null
    }
  },

  async logout(_userId?: string) {
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } finally {
      clearStoredAuth()
    }
  },

  async touchSession() {
    const storedAuth = readStoredAuth()
    if (!hasStoredAuthShape(storedAuth) || isExpired(storedAuth.session)) {
      clearStoredAuth()
      return null
    }

    const nextSession = {
      ...storedAuth.session,
      lastActivityAt: new Date().toISOString(),
    }

    writeStoredAuth({
      ...storedAuth,
      session: nextSession,
    })

    return nextSession
  },

  async changePassword(_userId: string, currentPassword: string, nextPassword: string) {
    try {
      const result = await apiRequest<{ success: true; message: string }>('/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword,
          newPassword: nextPassword,
        },
      })

      clearStoredAuth()
      return {
        success: true as const,
        message: result.message,
      }
    } catch (error) {
      return {
        success: false as const,
        message: getApiErrorMessage(error, 'Không thể đổi mật khẩu.'),
      }
    }
  },

  async updateProfile(payload: Partial<User>) {
    return normalizeUser(
      await apiRequest<BackendUser>('/users/me', {
        method: 'PATCH',
        body: pickProfilePayload(payload),
      }),
    )
  },

  async getAcademicRecords() {
    return apiRequest<AcademicRecords>('/users/me/academic-records')
  },

  async getStudentClasses(): Promise<string[]> {
    return apiRequest<string[]>('/users/student-classes')
  },
}

