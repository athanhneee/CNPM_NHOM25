import { apiRequest } from '@/lib/api-client'
import type { EnrollmentStatus } from '@/types/enrollment'
import type { ScheduleEntry } from '@/types/schedule'
import type { SectionStatus } from '@/types/section'

interface BackendScheduleEntry {
  id: string
  title?: string | null
  courseCode?: string | null
  sectionCode?: string | null
  weekday?: number | null
  startPeriod?: number | null
  periodCount?: number | null
  room?: string | null
  lecturerName?: string | null
  weeks?: string | null
  enrollmentStatus?: string | null
  sectionStatus?: string | null
}

const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'PENDING',
  'REGISTERED',
  'CANCELLED',
  'REJECTED',
  'COMPLETED',
  'FAILED',
  'WAITLISTED',
  'DROPPED',
]

const SECTION_STATUSES: SectionStatus[] = [
  'OPEN',
  'CLOSED',
  'FULL',
  'CANCELLED',
  'IN_PROGRESS',
  'COMPLETED',
]

function normalizeWeekday(value?: number | null): ScheduleEntry['weekday'] {
  if (value && value >= 2 && value <= 8) {
    return value as ScheduleEntry['weekday']
  }

  return 2
}

function normalizeEnrollmentStatus(value?: string | null) {
  return ENROLLMENT_STATUSES.includes(value as EnrollmentStatus)
    ? (value as EnrollmentStatus)
    : undefined
}

function normalizeSectionStatus(value?: string | null) {
  return SECTION_STATUSES.includes(value as SectionStatus) ? (value as SectionStatus) : undefined
}

function normalizeEntry(entry: BackendScheduleEntry): ScheduleEntry {
  const enrollmentStatus = normalizeEnrollmentStatus(entry.enrollmentStatus)
  const sectionStatus = normalizeSectionStatus(entry.sectionStatus)

  return {
    id: entry.id,
    title: entry.title ?? entry.courseCode ?? 'Học phần',
    courseCode: entry.courseCode ?? '',
    sectionCode: entry.sectionCode ?? '',
    weekday: normalizeWeekday(entry.weekday),
    startPeriod: entry.startPeriod ?? 1,
    periodCount: entry.periodCount ?? 1,
    room: entry.room ?? '',
    lecturerName: entry.lecturerName ?? '',
    weeks: entry.weeks ?? '',
    ...(enrollmentStatus ? { enrollmentStatus } : {}),
    ...(sectionStatus ? { sectionStatus } : {}),
  }
}

async function getSchedule(path: string) {
  return (await apiRequest<BackendScheduleEntry[]>(path)).map(normalizeEntry)
}

export const scheduleService = {
  getStudentWeekSchedule(studentId: string, semesterId: string) {
    return getSchedule(`/schedules/students/${studentId}/week/${semesterId}`)
  },

  getStudentSemesterSchedule(studentId: string, semesterId: string) {
    return getSchedule(`/schedules/students/${studentId}/semester/${semesterId}`)
  },

  getLecturerWeekSchedule(lecturerId: string, semesterId: string) {
    return getSchedule(`/schedules/lecturers/${lecturerId}/week/${semesterId}`)
  },

  getLecturerSemesterSchedule(lecturerId: string, semesterId: string) {
    return getSchedule(`/schedules/lecturers/${lecturerId}/semester/${semesterId}`)
  },
}
