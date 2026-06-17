import { useDataStore } from '@/app/store/data.store'
import { apiRequest } from '@/lib/api-client'
import type { UserRole } from '@/types/auth'
import type { Course } from '@/types/course'

interface CourseActor {
  actorId: string
  actorRole: UserRole
}

interface BackendCourse {
  id: string
  code: string
  name: string
  credits: number
  status?: Course['status'] | null
  department?: string | null
  campus?: string | null
  description?: string | null
  prerequisites?: unknown
  prestudy?: unknown
  corequisites?: unknown
  category?: Course['category'] | null
  faculty?: string | null
  courseType?: Course['courseType'] | string | null
  academicBlock?: Course['academicBlock'] | string | null
  suggestedSemester?: number | null
  lectureHours?: number | null
  practiceHours?: number | null
  labHours?: number | null
  passingScore?: number | null
  maxStudents?: number | null
  classSectionCount?: number | null
  gradingWeight?: Course['gradingWeight'] | null
  majorsSupported?: unknown
  majorCodesSupported?: unknown
  track?: string | null
  applicableSpecializations?: unknown
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const COURSE_MUTATION_FIELDS = [
  'code',
  'name',
  'credits',
  'department',
  'campus',
  'description',
  'status',
  'prerequisites',
  'prestudy',
  'corequisites',
  'category',
  'faculty',
  'courseType',
  'academicBlock',
  'suggestedSemester',
  'lectureHours',
  'practiceHours',
  'labHours',
  'passingScore',
  'maxStudents',
  'classSectionCount',
  'majorsSupported',
  'majorCodesSupported',
  'track',
  'applicableSpecializations',
] as const satisfies readonly (keyof Course)[]

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeCourse(course: BackendCourse): Course {
  return {
    id: course.id,
    code: course.code,
    name: course.name,
    credits: course.credits,
    status: course.status ?? 'ACTIVE',
    department: course.department ?? '',
    campus: course.campus ?? '',
    description: course.description ?? '',
    prerequisites: stringArray(course.prerequisites),
    prestudy: stringArray(course.prestudy),
    corequisites: stringArray(course.corequisites),
    category: course.category ?? 'CORE',
    faculty: course.faculty ?? undefined,
    courseType: course.courseType as Course['courseType'],
    academicBlock: course.academicBlock as Course['academicBlock'],
    suggestedSemester: course.suggestedSemester ?? undefined,
    lectureHours: course.lectureHours ?? undefined,
    practiceHours: course.practiceHours ?? undefined,
    labHours: course.labHours ?? undefined,
    passingScore: course.passingScore ?? undefined,
    maxStudents: course.maxStudents ?? undefined,
    classSectionCount: course.classSectionCount ?? undefined,
    gradingWeight: course.gradingWeight ?? undefined,
    majorsSupported: stringArray(course.majorsSupported),
    majorCodesSupported: stringArray(course.majorCodesSupported),
    track: course.track ?? undefined,
    applicableSpecializations: stringArray(course.applicableSpecializations),
  } as Course
}

function normalizeCourses(payload: BackendCourse[] | PaginatedResponse<BackendCourse>) {
  const courses = Array.isArray(payload) ? payload : payload.items
  return courses.map(normalizeCourse)
}

function syncCourses(courses: Course[]) {
  useDataStore.setState({ courses })
}

function upsertCourse(course: Course) {
  useDataStore.setState((state) => {
    const byId = new Map(state.courses.map((item) => [item.id, item]))
    byId.set(course.id, course)
    return { courses: Array.from(byId.values()).sort((left, right) => left.code.localeCompare(right.code)) }
  })
}

function pickCoursePayload(payload: Partial<Course>) {
  const nextPayload: Partial<Record<(typeof COURSE_MUTATION_FIELDS)[number], unknown>> = {}

  COURSE_MUTATION_FIELDS.forEach((field) => {
    const value = payload[field]
    if (value !== undefined) {
      nextPayload[field] = value
    }
  })

  return nextPayload
}

export const courseService = {
  async listCourses() {
    const courses = normalizeCourses(await apiRequest<BackendCourse[] | PaginatedResponse<BackendCourse>>('/courses'))
    syncCourses(courses)
    return courses
  },

  async getCourseById(courseId: string) {
    const course = normalizeCourse(await apiRequest<BackendCourse>(`/courses/${courseId}`))
    upsertCourse(course)
    return course
  },

  async createCourse(payload: Omit<Course, 'id'>, _actor?: CourseActor) {
    const course = normalizeCourse(
      await apiRequest<BackendCourse>('/courses', {
        method: 'POST',
        body: pickCoursePayload(payload),
      }),
    )
    upsertCourse(course)
    return course
  },

  async updateCourse(courseId: string, payload: Partial<Course>, _actor?: CourseActor) {
    const course = normalizeCourse(
      await apiRequest<BackendCourse>(`/courses/${courseId}`, {
        method: 'PATCH',
        body: pickCoursePayload(payload),
      }),
    )
    upsertCourse(course)
    return course
  },

  async softDeleteCourse(courseId: string, _actor?: CourseActor) {
    const course = normalizeCourse(
      await apiRequest<BackendCourse>(`/courses/${courseId}`, {
        method: 'DELETE',
      }),
    )
    upsertCourse(course)
    return course
  },
}
