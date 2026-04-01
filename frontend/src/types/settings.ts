export interface SemesterOption {
  id: string
  label: string
  isCurrent: boolean
  academicYear?: string
  termCode?: string
  registrationStatus?: 'UPCOMING' | 'OPEN' | 'ADJUSTMENT' | 'CLOSED' | 'COMPLETED'
  registrationStart?: string
  registrationEnd?: string
  adjustmentStart?: string
  adjustmentEnd?: string
}

export interface SystemSettings {
  simulationNow: string
  registrationStart: string
  registrationEnd: string
  adjustmentStart: string
  adjustmentEnd: string
  withdrawalDeadline: string
  maxCredits: number
  minCredits: number
  maintenanceMode: boolean
  allowWaitlist: boolean
  sessionTimeoutMinutes: number
  warningBeforeLogoutSeconds: number
  maxClassesPerDay: number
  maxClassesPerSemester: number
  currentSemesterId: string
  maintenanceMessage: string
}

export interface DashboardAnnouncement {
  id: string
  title: string
  tone: 'info' | 'warning' | 'success'
  description: string
}

export interface ReportRow {
  id: string
  sectionCode: string
  courseCode: string
  courseName: string
  lecturerName: string
  capacity: number
  registeredCount: number
  utilizationRate: number
  status: string
}

export interface ReportPreset {
  id: string
  label: string
  description: string
}
