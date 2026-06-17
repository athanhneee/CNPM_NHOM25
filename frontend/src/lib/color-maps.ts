import { formatPdfEnrollmentStatus, formatPdfSectionStatus } from '@/lib/status-conventions'
import type { AccountStatus } from '@/types/auth'
import type { EnrollmentStatus } from '@/types/enrollment'
import type { SectionStatus } from '@/types/section'

export const enrollmentStatusMap: Record<
  EnrollmentStatus,
  { label: string; tooltip: string; className: string }
> = {
  PENDING: formatPdfEnrollmentStatus('PENDING'),
  REGISTERED: formatPdfEnrollmentStatus('REGISTERED'),
  CANCELLED: formatPdfEnrollmentStatus('CANCELLED'),
  REJECTED: formatPdfEnrollmentStatus('REJECTED'),
  COMPLETED: formatPdfEnrollmentStatus('COMPLETED'),
  FAILED: formatPdfEnrollmentStatus('FAILED'),
  WAITLISTED: formatPdfEnrollmentStatus('WAITLISTED'),
  DROPPED: formatPdfEnrollmentStatus('DROPPED'),
}

export const sectionStatusMap: Record<
  SectionStatus,
  { label: string; tooltip: string; className: string }
> = {
  OPEN: formatPdfSectionStatus('OPEN'),
  CLOSED: formatPdfSectionStatus('CLOSED'),
  FULL: formatPdfSectionStatus('FULL'),
  CANCELLED: formatPdfSectionStatus('CANCELLED'),
  IN_PROGRESS: formatPdfSectionStatus('IN_PROGRESS'),
  COMPLETED: formatPdfSectionStatus('COMPLETED'),
}

export const accountStatusMap: Record<
  AccountStatus,
  { label: string; className: string }
> = {
  ACTIVE: { label: 'Hoạt động', className: 'bg-teal-50 text-teal-700 ring-teal-200' },
  LOCKED: { label: 'Bị khóa', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
  INACTIVE: { label: 'Tạm ngưng', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
}
