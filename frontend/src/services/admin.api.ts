import { useDataStore } from '@/app/store/data.store'
import { apiRequest, getApiErrorMessage } from '@/lib/api-client'
import {
  STUDENT_IMPORT_DEFAULT_PASSWORD,
  type StudentImportCandidate,
  type StudentImportSummary,
} from '@/lib/student-import'
import { settingsService } from '@/services/settings.api'
import type { AccountStatus, UserRole } from '@/types/auth'
import type { Course, WishRequest } from '@/types/course'
import type { Enrollment } from '@/types/enrollment'
import type { AuditLog } from '@/types/log'
import type { Section } from '@/types/section'
import type { SystemSettings } from '@/types/settings'
import type { User } from '@/types/user'

interface AdminActor {
  actorId: string
  actorRole: UserRole
}

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

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface BackendImportStudentsResponse {
  created: BackendUser[]
  skipped: StudentImportSummary['skipped']
  issues: StudentImportSummary['issues']
  defaultPassword?: string
}

type BackendSettings = Partial<SystemSettings> & {
  id?: number
  createdAt?: string
  updatedAt?: string
}

type SnapshotPayload = {
  users?: BackendUser[]
  courses?: Course[]
  sections?: Section[]
  enrollments?: Enrollment[]
  logs?: AuditLog[]
  auditLogs?: AuditLog[]
  wishes?: WishRequest[]
  wishRequests?: WishRequest[]
  settings?: BackendSettings[] | BackendSettings
}

interface ResetSnapshotResponse {
  reset: boolean
  message?: string
  snapshot?: SnapshotPayload
}

const USER_MUTATION_FIELDS = [
  'username',
  'email',
  'fullName',
  'phone',
  'secondaryEmail',
  'roles',
  'status',
  'campus',
  'department',
  'code',
  'faculty',
  'majorCode',
  'majorName',
  'studentClass',
  'studentStatus',
  'title',
  'position',
  'specialization',
  'yearLevel',
  'gpa',
  'attendanceRate',
  'completedCredits',
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

function normalizeUsers(payload: BackendUser[] | PaginatedResponse<BackendUser>) {
  const users = Array.isArray(payload) ? payload : payload.items
  return users.map(normalizeUser)
}

function syncUsers(users: User[]) {
  useDataStore.setState({ users })
}

function upsertUsers(users: User[]) {
  useDataStore.setState((state) => {
    const byId = new Map(state.users.map((user) => [user.id, user]))
    users.forEach((user) => byId.set(user.id, user))
    return { users: Array.from(byId.values()) }
  })
}

function upsertUser(user: User) {
  upsertUsers([user])
}

function pickUserPayload(payload: Partial<User>) {
  const nextPayload: Partial<Record<(typeof USER_MUTATION_FIELDS)[number], unknown>> = {}

  USER_MUTATION_FIELDS.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) {
      nextPayload[field] = value
    }
  })

  return nextPayload
}

function normalizeSettings(settings: BackendSettings): SystemSettings {
  const current = useDataStore.getState().settings
  return {
    ...current,
    simulationNow: settings.simulationNow ?? current.simulationNow,
    registrationStart: settings.registrationStart ?? current.registrationStart,
    registrationEnd: settings.registrationEnd ?? current.registrationEnd,
    adjustmentStart: settings.adjustmentStart ?? current.adjustmentStart,
    adjustmentEnd: settings.adjustmentEnd ?? current.adjustmentEnd,
    maxCreditsMain: settings.maxCreditsMain ?? current.maxCreditsMain ?? 24,
    maxCreditsSummer: settings.maxCreditsSummer ?? current.maxCreditsSummer ?? 12,
    minCredits: settings.minCredits ?? current.minCredits,
    maintenanceMode: settings.maintenanceMode ?? current.maintenanceMode,
    allowWaitlist: settings.allowWaitlist ?? current.allowWaitlist,
    sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? current.sessionTimeoutMinutes,
    warningBeforeLogoutSeconds:
      settings.warningBeforeLogoutSeconds ?? current.warningBeforeLogoutSeconds,
    maxClassesPerDay: settings.maxClassesPerDay ?? current.maxClassesPerDay,
    maxClassesPerSemester: settings.maxClassesPerSemester ?? current.maxClassesPerSemester,
    currentSemesterId: settings.currentSemesterId ?? current.currentSemesterId,
    maintenanceMessage: settings.maintenanceMessage ?? current.maintenanceMessage,
  }
}

function syncSettings(settings: SystemSettings) {
  useDataStore.setState({ settings })
}

function syncImportedSnapshot(payload: SnapshotPayload) {
  if (Array.isArray(payload.users)) {
    syncUsers(payload.users.map(normalizeUser))
  }

  if (Array.isArray(payload.courses)) {
    useDataStore.setState({ courses: payload.courses })
  }

  if (Array.isArray(payload.sections)) {
    useDataStore.setState({ sections: payload.sections })
  }

  if (Array.isArray(payload.enrollments)) {
    useDataStore.setState({ enrollments: payload.enrollments })
  }

  const logs = payload.logs ?? payload.auditLogs
  if (Array.isArray(logs)) {
    useDataStore.setState({ logs })
  }

  const wishes = payload.wishes ?? payload.wishRequests
  if (Array.isArray(wishes)) {
    useDataStore.setState({ wishes })
  }

  const settings = Array.isArray(payload.settings) ? payload.settings[0] : payload.settings
  if (settings) {
    syncSettings(normalizeSettings(settings))
  }
}

export const adminService = {
  async listUsers(query?: Record<string, string | number>) {
    const qs = query ? '?' + new URLSearchParams(query as Record<string, string>).toString() : ''
    const users = normalizeUsers(await apiRequest<BackendUser[] | PaginatedResponse<BackendUser>>(`/users${qs}`))
    syncUsers(users)
    return users
  },

  async updateUser(userId: string, payload: Partial<User>, _actor?: AdminActor) {
    const user = normalizeUser(
      await apiRequest<BackendUser>(`/users/${userId}`, {
        method: 'PATCH',
        body: pickUserPayload(payload),
      }),
    )
    upsertUser(user)
    return user
  },

  async createUser(
    payload: Omit<User, 'id' | 'passwordDigest' | 'failedLoginAttempts' | 'lastLoginAt'>,
    _actor?: AdminActor,
  ) {
    const user = normalizeUser(
      await apiRequest<BackendUser>('/users', {
        method: 'POST',
        body: pickUserPayload(payload),
      }),
    )
    upsertUser(user)
    return user
  },

  async createStudentUser(
    payload: Pick<StudentImportCandidate, 'fullName' | 'code'>,
    _actor?: AdminActor,
  ) {
    const user = normalizeUser(
      await apiRequest<BackendUser>('/users/students', {
        method: 'POST',
        body: payload,
      }),
    )
    upsertUser(user)
    return user
  },

  async importStudentUsers(payload: StudentImportCandidate[], _actor?: AdminActor) {
    const result = await apiRequest<BackendImportStudentsResponse>('/users/import-students', {
      method: 'POST',
      body: {
        students: payload,
      },
    })
    const created = result.created.map(normalizeUser)

    if (created.length) {
      upsertUsers(created)
    }

    return {
      created,
      skipped: result.skipped,
      issues: result.issues,
      defaultPassword: result.defaultPassword ?? STUDENT_IMPORT_DEFAULT_PASSWORD,
    } satisfies StudentImportSummary
  },

  async updateRoles(userId: string, roles: UserRole[], actor?: AdminActor) {
    return this.updateUser(userId, { roles }, actor)
  },

  async updateSettings(payload: Partial<SystemSettings>, _actor?: AdminActor) {
    return settingsService.updateSettings(payload)
  },

  async lockUser(userId: string, _actor?: AdminActor) {
    const user = normalizeUser(
      await apiRequest<BackendUser>(`/users/${userId}/lock`, {
        method: 'POST',
      }),
    )
    upsertUser(user)
    return user
  },

  async unlockUser(userId: string, _actor?: AdminActor) {
    const user = normalizeUser(
      await apiRequest<BackendUser>(`/users/${userId}/unlock`, {
        method: 'POST',
      }),
    )
    upsertUser(user)
    return user
  },

  async resetPassword(userId: string, password: string, _actor?: AdminActor) {
    const user = normalizeUser(
      await apiRequest<BackendUser>(`/users/${userId}/reset-password`, {
        method: 'POST',
        body: { password },
      }),
    )
    upsertUser(user)
    return user
  },

  async resetDemoData() {
    const result = await apiRequest<ResetSnapshotResponse>('/snapshot/reset', { method: 'POST' })
    if (result.snapshot) {
      syncImportedSnapshot(result.snapshot)
    } else {
      syncImportedSnapshot(await apiRequest<SnapshotPayload>('/snapshot/export'))
    }
    return result
  },

  async exportDemoData() {
    const snapshot = await apiRequest('/snapshot/export')
    return JSON.stringify(snapshot, null, 2)
  },

  async importDemoData(rawData: string) {
    try {
      const payload = JSON.parse(rawData) as SnapshotPayload
      await apiRequest('/snapshot/import', {
        method: 'POST',
        body: payload,
      })
      syncImportedSnapshot(payload)
      return { ok: true as const }
    } catch (error) {
      return {
        ok: false as const,
        error: getApiErrorMessage(error, 'Dữ liệu import không hợp lệ.'),
      }
    }
  },
}
