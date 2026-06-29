export type SectionStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'FULL'
  | 'CANCELLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'

export interface Section {
  id: string
  sectionCode: string
  courseCode: string
  semesterId: string
  group: string
  subGroup: string
  lecturerId?: string
  guestLecturer?: string
  room: string
  weekday: 2 | 3 | 4 | 5 | 6 | 7 | 8
  startPeriod: number
  periodCount: number
  weeks: string
  capacity: number
  registeredCount: number
  waitlistCount: number
  allowWaitlist: boolean
  status: SectionStatus
  campus: string
  notes?: string
  examSlot?: string
}

export interface RoomSchedule {
  id: string
  room: string
  semesterId: string
  weekday: Section['weekday']
  startPeriod: number
  periodCount: number
  sectionId: string
}
