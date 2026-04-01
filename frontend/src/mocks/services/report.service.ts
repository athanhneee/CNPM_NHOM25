import { useDataStore } from '@/app/store/data.store'
import { exportRowsToCsv } from '@/lib/export'
import { getRandomDelay, sleep } from '@/lib/utils'
import type { ReportRow } from '@/types/settings'

function buildReportRows() {
  const snapshot = useDataStore.getState()

  return snapshot.sections
    .filter((section) => section.semesterId === snapshot.settings.currentSemesterId)
    .map((section) => {
      const course = snapshot.courses.find((item) => item.code === section.courseCode)
      const lecturer = snapshot.users.find((user) => user.id === section.lecturerId)
      return {
        id: section.id,
        sectionCode: section.sectionCode,
        courseCode: section.courseCode,
        courseName: course?.name ?? section.sectionCode,
        lecturerName: lecturer?.fullName ?? 'Chua phan cong',
        capacity: section.capacity,
        registeredCount: section.registeredCount,
        utilizationRate: section.capacity ? section.registeredCount / section.capacity : 0,
        status: section.status,
      } satisfies ReportRow
    })
}

export const reportService = {
  async getRegistrationSummary() {
    await sleep(getRandomDelay())
    return buildReportRows()
  },
  async getUtilizationStats() {
    await sleep(120)
    const rows = buildReportRows()
    const totalSections = rows.length
    const totalCapacity = rows.reduce((sum, row) => sum + row.capacity, 0)
    const totalRegistered = rows.reduce((sum, row) => sum + row.registeredCount, 0)
    const fullSections = rows.filter((row) => row.status === 'FULL').length
    return {
      totalSections,
      totalCapacity,
      totalRegistered,
      averageUtilization: totalCapacity ? totalRegistered / totalCapacity : 0,
      fullSections,
    }
  },
  async exportReportCsv(fileName = 'bao-cao-dang-ky.csv') {
    await sleep(80)
    const rows = buildReportRows().map((row) => ({
      lop_hoc_phan: row.sectionCode,
      ma_mon: row.courseCode,
      ten_mon: row.courseName,
      giang_vien: row.lecturerName,
      si_so_toi_da: row.capacity,
      da_dang_ky: row.registeredCount,
      ty_le_lap_day: `${Math.round(row.utilizationRate * 100)}%`,
      trang_thai: row.status,
    }))
    exportRowsToCsv(fileName, rows)
  },
}
