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
  ACTIVE: { label: 'Hoạt động', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  LOCKED: { label: 'Bị khóa', className: 'bg-[var(--color-accent-100)] text-[var(--color-accent)] ring-[var(--color-accent-disabled)]' },
  INACTIVE: { label: 'Tạm ngưng', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  DEFERRED: { label: 'Bảo lưu', className: 'bg-yellow-100 text-yellow-800' },
  SUSPENDED: { label: 'Đình chỉ', className: 'bg-orange-100 text-orange-800' },
}
