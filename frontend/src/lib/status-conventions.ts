import type { EligibilityCheckResult, EnrollmentStatus } from '@/types/enrollment'
import type { Section, SectionStatus } from '@/types/section'

export type PdfEnrollmentStatusCode = 'DK_TC' | 'HUY_DK' | 'KHONG_DU_DK' | 'NGOAI_TGDK'
export type PdfSectionStatusCode = 'OPEN' | 'FULL' | 'CLOSED'

export const pdfEnrollmentStatusMap: Record<
  PdfEnrollmentStatusCode,
  { label: string; tooltip: string; className: string }
> = {
  DK_TC: {
    label: 'Đăng ký thành công',
    tooltip: 'Sinh viên đăng ký thành công lớp học phần và kết quả đăng ký hợp lệ.',
    className: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  HUY_DK: {
    label: 'Đã hủy đăng ký',
    tooltip: 'Sinh viên đã hủy lớp học phần trong khoảng thời gian được phép thao tác.',
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
  KHONG_DU_DK: {
    label: 'Không đủ điều kiện',
    tooltip: 'Hệ thống từ chối đăng ký do chưa đáp ứng điều kiện đăng ký.',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  NGOAI_TGDK: {
    label: 'Ngoài thời gian đăng ký',
    tooltip: 'Sinh viên thao tác khi chưa đến hoặc đã hết thời gian đăng ký theo cấu hình.',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
}

export const pdfSectionStatusMap: Record<
  PdfSectionStatusCode,
  { label: string; tooltip: string; className: string }
> = {
  OPEN: {
    label: 'Lớp đang mở đăng ký',
    tooltip: 'Lớp học phần đang cho phép sinh viên đăng ký và vẫn còn khả năng tiếp nhận.',
    className: 'bg-teal-50 text-teal-700 ring-teal-200',
  },
  FULL: {
    label: 'Lớp hết chỗ',
    tooltip: 'Lớp học phần đã đủ số lượng sinh viên theo giới hạn cho phép.',
    className: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  CLOSED: {
    label: 'Lớp không mở đăng ký',
    tooltip: 'Lớp học phần hiện không cho phép sinh viên đăng ký trên cổng thông tin.',
    className: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
}

export function mapEnrollmentStatusToPdfStatus(status: EnrollmentStatus): PdfEnrollmentStatusCode {
  if (status === 'REGISTERED' || status === 'COMPLETED') {
    return 'DK_TC'
  }

  if (status === 'CANCELLED' || status === 'DROPPED') {
    return 'HUY_DK'
  }

  return 'KHONG_DU_DK'
}

export function mapRegistrationErrorToPdfStatus(errorCode?: string): PdfEnrollmentStatusCode {
  if (
    errorCode === 'REG_ERR_OUTSIDE_REGISTRATION_WINDOW' ||
    errorCode === 'REG_ERR_OUTSIDE_ADJUSTMENT_WINDOW'
  ) {
    return 'NGOAI_TGDK'
  }

  return 'KHONG_DU_DK'
}

export function mapEligibilityResultToPdfStatus(
  result: Pick<EligibilityCheckResult, 'canRegister' | 'finalStatus' | 'errorCode'>,
): PdfEnrollmentStatusCode {
  if (result.canRegister && result.finalStatus) {
    return mapEnrollmentStatusToPdfStatus(result.finalStatus)
  }

  return mapRegistrationErrorToPdfStatus(result.errorCode)
}

export function mapSectionStatusToPdfStatus(
  status: SectionStatus,
  section?: Pick<Section, 'registeredCount' | 'capacity'>,
): PdfSectionStatusCode {
  if (status === 'FULL' || (status === 'OPEN' && section && section.registeredCount >= section.capacity)) {
    return 'FULL'
  }

  if (status === 'OPEN') {
    return 'OPEN'
  }

  return 'CLOSED'
}

export function formatPdfEnrollmentStatus(status: EnrollmentStatus) {
  const code = mapEnrollmentStatusToPdfStatus(status)
  const config = pdfEnrollmentStatusMap[code]
  return {
    code,
    label: `${code} - ${config.label}`,
    tooltip: config.tooltip,
    className: config.className,
  }
}

export function formatPdfSectionStatus(status: SectionStatus) {
  const code = mapSectionStatusToPdfStatus(status)
  const config = pdfSectionStatusMap[code]
  return {
    code,
    label: `${code} - ${config.label}`,
    tooltip: config.tooltip,
    className: config.className,
  }
}
