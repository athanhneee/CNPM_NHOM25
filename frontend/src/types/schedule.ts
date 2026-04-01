import type { EnrollmentStatus } from '@/types/enrollment'
import type { SectionStatus } from '@/types/section'

export interface ScheduleEntry {
  id: string
  title: string
  courseCode: string
  sectionCode: string
  weekday: 2 | 3 | 4 | 5 | 6 | 7 | 8
  startPeriod: number
  periodCount: number
  room: string
  lecturerName: string
  weeks: string
  enrollmentStatus?: EnrollmentStatus
  sectionStatus?: SectionStatus
}

export interface CalendarLegendItem {
  label: string
  className: string
}
