import type { UserRole } from '@/types/auth'

export type EnrollmentStatus =
  | 'PENDING'
  | 'REGISTERED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'WAITLISTED'
  | 'DROPPED'

export type EnrollmentConventionCode = 'DK_TC' | 'HUY_DK' | 'KHONG_DU_DK' | 'NGOAI_TGDK'

export interface EnrollmentTimelineItem {
  status: EnrollmentStatus
  timestamp: string
  actorId: string
  actorRole: UserRole
  note: string
}

export interface Enrollment {
  id: string
  studentId: string
  sectionId: string
  semesterId: string
  courseCode?: string
  status: EnrollmentStatus
  pdfStatusCode?: EnrollmentConventionCode
  createdAt: string
  updatedAt: string
  cancelledAt?: string
  droppedAt?: string
  reasonCode?: string
  waitlistOrder?: number
  isRetake?: boolean
  isImprovement?: boolean
  timeline: EnrollmentTimelineItem[]
}

export interface EligibilityCheckResult {
  canRegister: boolean
  finalStatus: EnrollmentStatus | null
  pdfStatusCode?: EnrollmentConventionCode
  errorCode?: string | undefined
  message: string
  isRetake?: boolean
  isImprovement?: boolean
  checks: Array<{
    key: string
    label: string
    passed: boolean
    message: string
  }>
}
