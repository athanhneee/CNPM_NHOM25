import { exportRowsToCsv } from '@/lib/export'
import { apiRequest } from '@/lib/api-client'
import type { ReportRow, UtilizationStats } from '@/types/settings'

export const reportService = {
  async getRegistrationSummary(semesterId?: string) {
    const query = semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ''
    return apiRequest<ReportRow[]>(`/reports/registration-summary${query}`)
  },

  async getUtilizationStats(semesterId?: string) {
    const query = semesterId ? `?semesterId=${encodeURIComponent(semesterId)}` : ''
    return apiRequest<UtilizationStats>(`/reports/utilization-stats${query}`)
  },

  async exportReportCsv(fileName = 'bao-cao-dang-ky.csv', semesterId?: string) {
    const rows = await this.getRegistrationSummary(semesterId)
    exportRowsToCsv(
      fileName,
      rows.map((row) => ({
        lop_hoc_phan: row.sectionCode,
        ma_mon: row.courseCode,
        ten_mon: row.courseName,
        giang_vien: row.lecturerName,
        si_so_toi_da: row.capacity,
        da_dang_ky: row.registeredCount,
        danh_sach_cho: row.waitlistCount,
        ty_le_lap_day: `${Math.round(row.utilizationRate * 100)}%`,
        trang_thai: row.status,
      })),
    )
  },
}
