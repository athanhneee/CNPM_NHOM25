import { useDataStore } from '@/app/store/data.store'
import { ApiError, apiRequest } from '@/lib/api-client'
import type { UserRole } from '@/types/auth'
import type { Enrollment, EnrollmentStatus } from '@/types/enrollment'
import type { Section, SectionStatus } from '@/types/section'
import type { User } from '@/types/user'

interface SectionActor {
  actorId: string
  actorRole: UserRole
}

interface BackendSection {
  id: string
  sectionCode: string
  courseCode: string
  semesterId: string
  group: string
  subGroup?: string | null
  lecturerId: string
  room?: string | null
  weekday: number
  startPeriod: number
  periodCount: number
  weeks: string
  capacity: number
  registeredCount?: number | null
  waitlistCount?: number | null
  allowWaitlist?: boolean | null
  status?: SectionStatus | string | null
  campus?: string | null
  notes?: string | null
  examSlot?: string | null
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SectionQuery {
  search?: string
  semesterId?: string
  courseCode?: string
  lecturerId?: string
  status?: SectionStatus
  campus?: string
}

interface BackendSectionStudentRow {
  id: string
  studentId: string
  sectionId: string
  semesterId: string
  status?: string | null
  createdAt?: string | Date | null
  updatedAt?: string | Date | null
  cancelledAt?: string | Date | null
  droppedAt?: string | Date | null
  reasonCode?: string | null
  waitlistOrder?: number | null
  timeline?: unknown
  student: Partial<User> & {
    id: string
    username: string
    email: string
    fullName: string
    roles: UserRole[]
  }
}

export interface SectionStudentRow {
  enrollment: Enrollment
  student: Partial<User> & Pick<User, 'id' | 'username' | 'email' | 'fullName' | 'roles'>
}

const SECTION_MUTATION_FIELDS = [
  'sectionCode',
  'courseCode',
  'semesterId',
  'group',
  'subGroup',
  'lecturerId',
  'room',
  'weekday',
  'startPeriod',
  'periodCount',
  'weeks',
  'capacity',
  'allowWaitlist',
  'status',
  'campus',
  'notes',
  'examSlot',
] as const satisfies readonly (keyof Section)[]

const SECTION_STATUSES = ['OPEN', 'CLOSED', 'FULL', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'] as const
const ENROLLMENT_STATUSES = [
  'PENDING',
  'REGISTERED',
  'CANCELLED',
  'REJECTED',
  'COMPLETED',
  'FAILED',
  'WAITLISTED',
  'DROPPED',
] as const
const WEEKDAYS = [2, 3, 4, 5, 6, 7, 8] as const

function normalizeWeekday(value: number): Section['weekday'] {
  return WEEKDAYS.includes(value as Section['weekday']) ? (value as Section['weekday']) : 2
}

function normalizeStatus(value: string | null | undefined): SectionStatus {
  return SECTION_STATUSES.includes(value as SectionStatus) ? (value as SectionStatus) : 'OPEN'
}

function normalizeEnrollmentStatus(value: string | null | undefined): EnrollmentStatus {
  return ENROLLMENT_STATUSES.includes(value as EnrollmentStatus) ? (value as EnrollmentStatus) : 'PENDING'
}

function normalizeIso(value: string | Date | null | undefined, fallback = new Date().toISOString()) {
  if (!value) {
    return fallback
  }

  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString()
}

function normalizeSection(section: BackendSection): Section {
  return {
    id: section.id,
    sectionCode: section.sectionCode,
    courseCode: section.courseCode,
    semesterId: section.semesterId,
    group: section.group,
    subGroup: section.subGroup ?? '',
    lecturerId: section.lecturerId,
    room: section.room ?? '',
    weekday: normalizeWeekday(section.weekday),
    startPeriod: section.startPeriod,
    periodCount: section.periodCount,
    weeks: section.weeks,
    capacity: section.capacity,
    registeredCount: section.registeredCount ?? 0,
    waitlistCount: section.waitlistCount ?? 0,
    allowWaitlist: section.allowWaitlist ?? true,
    status: normalizeStatus(section.status),
    campus: section.campus ?? '',
    notes: section.notes ?? undefined,
    examSlot: section.examSlot ?? undefined,
  } as Section
}

function normalizeSections(payload: BackendSection[] | PaginatedResponse<BackendSection>) {
  const sections = Array.isArray(payload) ? payload : payload.items
  return sections.map(normalizeSection)
}

function normalizeSectionStudent(row: BackendSectionStudentRow): SectionStudentRow {
  const status = normalizeEnrollmentStatus(row.status)
  const createdAt = normalizeIso(row.createdAt)
  const updatedAt = normalizeIso(row.updatedAt, createdAt)
  const enrollment: Enrollment = {
    id: row.id,
    studentId: row.studentId,
    sectionId: row.sectionId,
    semesterId: row.semesterId,
    status,
    createdAt,
    updatedAt,
    timeline: [],
  }

  if (row.cancelledAt) {
    enrollment.cancelledAt = normalizeIso(row.cancelledAt, updatedAt)
  }

  if (row.droppedAt) {
    enrollment.droppedAt = normalizeIso(row.droppedAt, updatedAt)
  }

  if (row.reasonCode) {
    enrollment.reasonCode = row.reasonCode
  }

  if (typeof row.waitlistOrder === 'number') {
    enrollment.waitlistOrder = row.waitlistOrder
  }

  return {
    enrollment,
    student: row.student,
  }
}

function syncSections(sections: Section[]) {
  useDataStore.setState({ sections })
}

function upsertSection(section: Section) {
  useDataStore.setState((state) => {
    const byId = new Map(state.sections.map((item) => [item.id, item]))
    byId.set(section.id, section)
    return {
      sections: Array.from(byId.values()).sort((left, right) =>
        left.sectionCode.localeCompare(right.sectionCode),
      ),
    }
  })
}

function pickSectionPayload(payload: Partial<Section>) {
  const nextPayload: Partial<Record<(typeof SECTION_MUTATION_FIELDS)[number], unknown>> = {}

  SECTION_MUTATION_FIELDS.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) {
      nextPayload[field] = value
    }
  })

  return nextPayload
}

function queryPath(basePath: string, query: SectionQuery = {}) {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value)
    }
  })

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export const sectionService = {
  async listSections(query: SectionQuery = {}) {
    const sections = normalizeSections(
      await apiRequest<BackendSection[] | PaginatedResponse<BackendSection>>(queryPath('/sections', query)),
    )
    if (Object.values(query).some(Boolean)) {
      sections.forEach(upsertSection)
    } else {
      syncSections(sections)
    }
    return sections
  },

  async listMyTeachingSections(query: SectionQuery = {}) {
    const sections = normalizeSections(
      await apiRequest<BackendSection[] | PaginatedResponse<BackendSection>>(queryPath('/sections/my-teaching', query)),
    )
    if (Object.values(query).some(Boolean)) {
      sections.forEach(upsertSection)
    } else {
      syncSections(sections)
    }
    return sections
  },

  async getSectionDetail(sectionId: string) {
    try {
      const section = normalizeSection(await apiRequest<BackendSection>(`/sections/${sectionId}`))
      upsertSection(section)
      return section
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }

      throw error
    }
  },

  async createSection(
    payload: Omit<Section, 'id' | 'registeredCount' | 'waitlistCount'> & {
      registeredCount?: number
      waitlistCount?: number
    },
    _actor?: SectionActor,
  ) {
    const section = normalizeSection(
      await apiRequest<BackendSection>('/sections', {
        method: 'POST',
        body: pickSectionPayload(payload),
      }),
    )
    upsertSection(section)
    return section
  },

  async updateSection(sectionId: string, payload: Partial<Section>, _actor?: SectionActor) {
    const section = normalizeSection(
      await apiRequest<BackendSection>(`/sections/${sectionId}`, {
        method: 'PATCH',
        body: pickSectionPayload(payload),
      }),
    )
    upsertSection(section)
    return section
  },

  async assignLecturer(sectionId: string, lecturerId: string, _actor?: SectionActor) {
    const section = normalizeSection(
      await apiRequest<BackendSection>(`/sections/${sectionId}/assign-lecturer`, {
        method: 'PATCH',
        body: { lecturerId },
      }),
    )
    upsertSection(section)
    return section
  },

  async updateRoomSchedule(
    sectionId: string,
    payload: Pick<Section, 'room' | 'weekday' | 'startPeriod' | 'periodCount'>,
    _actor?: SectionActor,
  ) {
    const section = normalizeSection(
      await apiRequest<BackendSection>(`/sections/${sectionId}/room-schedule`, {
        method: 'PATCH',
        body: payload,
      }),
    )
    upsertSection(section)
    return section
  },

  async updateCapacity(sectionId: string, capacity: number, reason: string, _actor?: SectionActor) {
    const section = normalizeSection(
      await apiRequest<BackendSection>(`/sections/${sectionId}/capacity`, {
        method: 'PATCH',
        body: { capacity, reason },
      }),
    )
    upsertSection(section)
    return section
  },

  async getSectionStudents(sectionId: string) {
    return (
      await apiRequest<BackendSectionStudentRow[]>(`/sections/${sectionId}/students`)
    ).map(normalizeSectionStudent)
  },
}
