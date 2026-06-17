import { useDataStore } from '@/app/store/data.store'
import { ApiError, apiRequest, getApiErrorMessage } from '@/lib/api-client'
import {
  mapEligibilityResultToPdfStatus,
  mapEnrollmentStatusToPdfStatus,
  mapRegistrationErrorToPdfStatus,
} from '@/lib/status-conventions'
import type { UserRole } from '@/types/auth'
import type {
  EligibilityCheckResult,
  Enrollment,
  EnrollmentConventionCode,
  EnrollmentStatus,
  EnrollmentTimelineItem,
} from '@/types/enrollment'
import { sectionService } from './section.api'

interface EnrollmentActor {
  actorId: string
  actorRole: UserRole
}

interface BackendEnrollmentTimelineItem {
  status?: string | null
  timestamp?: string | Date | null
  actorId?: string | null
  actorRole?: string | null
  note?: string | null
}

interface BackendEnrollment {
  id: string
  studentId: string
  sectionId: string
  semesterId: string
  status?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  cancelledAt?: string | Date | null
  droppedAt?: string | Date | null
  reasonCode?: string | null
  waitlistOrder?: number | null
  timeline?: unknown
  pdfStatusCode?: EnrollmentConventionCode | null
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface RegisterApiResponse {
  success: boolean
  message: string
  enrollment?: BackendEnrollment
  errorCode?: string
  pdfStatusCode?: EnrollmentConventionCode
  checks?: EligibilityCheckResult['checks']
}

interface RegisterResponse {
  success: boolean
  message: string
  enrollment?: Enrollment
  errorCode?: string
  pdfStatusCode?: EnrollmentConventionCode
  checks?: EligibilityCheckResult['checks']
}

interface EnrollmentQuery {
  studentId?: string
  sectionId?: string
  semesterId?: string
  status?: EnrollmentStatus
}

interface CancelWithdrawResponse {
  enrollment: BackendEnrollment
  promoted?: BackendEnrollment[]
  warnings?: string[]
}

const ENROLLMENT_STATUSES = [
  'PENDING',
  'REGISTERED',
  'CANCELLED',
  'REJECTED',
  'COMPLETED',
  'FAILED',
  'WAITLISTED',
  'DROPPED',
] as const

const USER_ROLES = ['STUDENT', 'LECTURER', 'ACADEMIC_OFFICE', 'ADMIN'] as const

function normalizeStatus(value: string | null | undefined): EnrollmentStatus {
  return ENROLLMENT_STATUSES.includes(value as EnrollmentStatus) ? (value as EnrollmentStatus) : 'PENDING'
}

function normalizeRole(value: string | null | undefined): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : 'STUDENT'
}

function normalizeIso(value: string | Date | null | undefined, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function normalizeTimelineItem(
  item: unknown,
  fallbackStatus: EnrollmentStatus,
  fallbackTimestamp: string,
): EnrollmentTimelineItem | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const rawItem = item as BackendEnrollmentTimelineItem
  return {
    status: normalizeStatus(rawItem.status ?? fallbackStatus),
    timestamp: normalizeIso(rawItem.timestamp, fallbackTimestamp),
    actorId: rawItem.actorId ?? '',
    actorRole: normalizeRole(rawItem.actorRole),
    note: rawItem.note ?? '',
  }
}

function normalizeTimeline(
  value: unknown,
  fallbackStatus: EnrollmentStatus,
  fallbackTimestamp: string,
): EnrollmentTimelineItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => normalizeTimelineItem(item, fallbackStatus, fallbackTimestamp))
    .filter((item): item is EnrollmentTimelineItem => Boolean(item))
}

function normalizeEnrollment(rawEnrollment: BackendEnrollment): Enrollment {
  const status = normalizeStatus(rawEnrollment.status)
  const createdAt = normalizeIso(rawEnrollment.createdAt)
  const updatedAt = normalizeIso(rawEnrollment.updatedAt, createdAt)
  const enrollment: Enrollment = {
    id: rawEnrollment.id,
    studentId: rawEnrollment.studentId,
    sectionId: rawEnrollment.sectionId,
    semesterId: rawEnrollment.semesterId,
    status,
    pdfStatusCode: rawEnrollment.pdfStatusCode ?? mapEnrollmentStatusToPdfStatus(status),
    createdAt,
    updatedAt,
    timeline: normalizeTimeline(rawEnrollment.timeline, status, updatedAt),
  }

  if (rawEnrollment.cancelledAt) {
    enrollment.cancelledAt = normalizeIso(rawEnrollment.cancelledAt, updatedAt)
  }

  if (rawEnrollment.droppedAt) {
    enrollment.droppedAt = normalizeIso(rawEnrollment.droppedAt, updatedAt)
  }

  if (rawEnrollment.reasonCode) {
    enrollment.reasonCode = rawEnrollment.reasonCode
  }

  if (typeof rawEnrollment.waitlistOrder === 'number') {
    enrollment.waitlistOrder = rawEnrollment.waitlistOrder
  }

  return enrollment
}

function normalizeEnrollments(payload: BackendEnrollment[] | PaginatedResponse<BackendEnrollment>) {
  const enrollments = Array.isArray(payload) ? payload : payload.items
  return enrollments.map(normalizeEnrollment)
}

function queryPath(basePath: string, query: EnrollmentQuery = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

function syncEnrollments(enrollments: Enrollment[]) {
  useDataStore.setState({ enrollments })
}

function syncStudentEnrollments(studentId: string, enrollments: Enrollment[], semesterId?: string) {
  useDataStore.setState((state) => ({
    enrollments: [
      ...state.enrollments.filter((enrollment) => {
        if (enrollment.studentId !== studentId) {
          return true
        }

        return semesterId ? enrollment.semesterId !== semesterId : false
      }),
      ...enrollments,
    ],
  }))
}

function upsertEnrollments(enrollments: Enrollment[]) {
  if (!enrollments.length) {
    return
  }

  useDataStore.setState((state) => {
    const byId = new Map(state.enrollments.map((enrollment) => [enrollment.id, enrollment]))
    enrollments.forEach((enrollment) => byId.set(enrollment.id, enrollment))
    return { enrollments: Array.from(byId.values()) }
  })
}

async function refreshSections() {
  await sectionService.listSections()
}

function normalizeEligibility(result: EligibilityCheckResult): EligibilityCheckResult {
  return {
    ...result,
    pdfStatusCode: result.pdfStatusCode ?? mapEligibilityResultToPdfStatus(result),
  }
}

function errorCodeFromApiError(error: unknown) {
  if (!(error instanceof ApiError) || !error.details || typeof error.details !== 'object') {
    return undefined
  }

  const details = error.details as { errorCode?: unknown }
  return typeof details.errorCode === 'string' ? details.errorCode : undefined
}

function failedRegisterResponse(error: unknown): RegisterResponse {
  const errorCode = errorCodeFromApiError(error)
  return {
    success: false,
    message: getApiErrorMessage(error, 'Không thể đăng ký học phần.'),
    ...(errorCode ? { errorCode } : {}),
    pdfStatusCode: mapRegistrationErrorToPdfStatus(errorCode),
    checks: [],
  }
}

function normalizeRegisterResponse(response: RegisterApiResponse): RegisterResponse {
  const enrollment = response.enrollment ? normalizeEnrollment(response.enrollment) : undefined
  if (enrollment) {
    upsertEnrollments([enrollment])
  }

  return {
    success: response.success,
    message: response.message,
    ...(enrollment ? { enrollment } : {}),
    ...(response.errorCode ? { errorCode: response.errorCode } : {}),
    pdfStatusCode:
      response.pdfStatusCode ??
      (enrollment
        ? mapEnrollmentStatusToPdfStatus(enrollment.status)
        : mapRegistrationErrorToPdfStatus(response.errorCode)),
    checks: response.checks ?? [],
  }
}

export const enrollmentService = {
  async listEnrollments(query: EnrollmentQuery = {}) {
    const enrollments = normalizeEnrollments(
      await apiRequest<BackendEnrollment[] | PaginatedResponse<BackendEnrollment>>(queryPath('/enrollments', query)),
    )
    if (Object.values(query).some(Boolean)) {
      upsertEnrollments(enrollments)
    } else {
      syncEnrollments(enrollments)
    }
    return enrollments
  },

  async checkEligibility(studentId: string, sectionId: string) {
    try {
      return normalizeEligibility(
        await apiRequest<EligibilityCheckResult>('/enrollments/eligibility', {
          method: 'POST',
          body: { studentId, sectionId },
        }),
      )
    } catch (error) {
      const errorCode = errorCodeFromApiError(error)
      return {
        canRegister: false,
        finalStatus: null,
        message: getApiErrorMessage(error, 'Không thể kiểm tra điều kiện đăng ký.'),
        ...(errorCode ? { errorCode } : {}),
        pdfStatusCode: mapRegistrationErrorToPdfStatus(errorCode),
        checks: [],
      } satisfies EligibilityCheckResult
    }
  },

  async registerSection(studentId: string, sectionId: string, _actor?: EnrollmentActor) {
    try {
      const result = normalizeRegisterResponse(
        await apiRequest<RegisterApiResponse>('/enrollments/register', {
          method: 'POST',
          body: { studentId, sectionId },
        }),
      )
      await refreshSections()
      return result
    } catch (error) {
      return failedRegisterResponse(error)
    }
  },

  async cancelEnrollment(enrollmentId: string, _actor?: EnrollmentActor, reason?: string) {
    const response = await apiRequest<CancelWithdrawResponse>(`/enrollments/${enrollmentId}/cancel`, {
      method: 'POST',
      body: { reason },
    })
    
    const enrollment = normalizeEnrollment(response.enrollment)
    const promoted = response.promoted ? normalizeEnrollments(response.promoted) : []
    
    upsertEnrollments([enrollment, ...promoted])
    await refreshSections()
    return { enrollment, promoted, warnings: response.warnings ?? [] }
  },

  async withdrawEnrollment(enrollmentId: string, reason: string, _actor?: EnrollmentActor) {
    const response = await apiRequest<CancelWithdrawResponse>(`/enrollments/${enrollmentId}/withdraw`, {
      method: 'POST',
      body: { reason },
    })
    
    const enrollment = normalizeEnrollment(response.enrollment)
    const promoted = response.promoted ? normalizeEnrollments(response.promoted) : []

    upsertEnrollments([enrollment, ...promoted])
    await refreshSections()
    return { enrollment, promoted, warnings: response.warnings ?? [] }
  },

  async listHistory(studentId: string) {
    const enrollments = normalizeEnrollments(
      await apiRequest<BackendEnrollment[] | PaginatedResponse<BackendEnrollment>>(
        queryPath('/enrollments', { studentId }),
      ),
    )
    syncStudentEnrollments(studentId, enrollments)
    return enrollments
  },

  async listCurrentEnrollments(studentId: string, semesterId: string) {
    const enrollments = normalizeEnrollments(
      await apiRequest<BackendEnrollment[] | PaginatedResponse<BackendEnrollment>>(
        queryPath('/enrollments', { studentId, semesterId }),
      ),
    )
    syncStudentEnrollments(studentId, enrollments, semesterId)
    return enrollments
  },

  async processWaitlist(sectionId: string, _actor?: EnrollmentActor) {
    const enrollments = normalizeEnrollments(
      await apiRequest<BackendEnrollment[]>(`/enrollments/sections/${sectionId}/process-waitlist`, {
        method: 'POST',
      }),
    )
    upsertEnrollments(enrollments)
    await refreshSections()
    return enrollments
  },

  async overrideEnrollment(studentId: string, sectionId: string, reason: string, _actor?: EnrollmentActor) {
    const enrollment = normalizeEnrollment(
      await apiRequest<BackendEnrollment>('/enrollments/override', {
        method: 'POST',
        body: { studentId, sectionId, reason },
      }),
    )
    upsertEnrollments([enrollment])
    await refreshSections()
    return enrollment
  },
}
