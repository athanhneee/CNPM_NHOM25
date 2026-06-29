import { apiRequest } from '@/lib/api-client'
import type { CourseOptionsQuery, CourseOptionsResponse } from '@/types/registration'

function buildQueryString(query: CourseOptionsQuery): string {
  const params = new URLSearchParams()
  params.set('mode', query.mode)

  if (query.studentId) params.set('studentId', query.studentId)
  if (query.studentClassCode) params.set('studentClassCode', query.studentClassCode)
  if (query.termId) params.set('termId', query.termId)
  if (query.courseCode) params.set('courseCode', query.courseCode)
  if (query.department) params.set('department', query.department)
  if (query.sectionCode) params.set('sectionCode', query.sectionCode)
  if (query.keyword) params.set('keyword', query.keyword)
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))

  return params.toString()
}

export const registrationService = {
  /**
   * Fetch course options from backend.
   * Supports AbortSignal for cancellation on mode/filter changes.
   */
  async getCourseOptions(
    query: CourseOptionsQuery,
    signal?: AbortSignal,
  ): Promise<CourseOptionsResponse> {
    const qs = buildQueryString(query)
    return apiRequest<CourseOptionsResponse>(
      `/enrollments/registration/course-options?${qs}`,
      signal ? { signal } : {},
    )
  },
}

/**
 * Fetch department list from courses.
 * Uses existing courses API to get unique departments/faculties.
 */
export async function fetchDepartments(): Promise<Array<{ value: string; label: string }>> {
  try {
    const courses = await apiRequest<Array<{ department: string; faculty?: string }>>('/courses')
    const deptSet = new Map<string, string>()
    for (const c of courses) {
      const key = c.faculty ?? c.department
      if (key && !deptSet.has(key)) {
        deptSet.set(key, key)
      }
    }
    return Array.from(deptSet.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'))
  } catch {
    return []
  }
}

/**
 * Fetch course list for dropdown selection.
 * Returns { value: courseCode, label: "courseCode - courseName" } for each active course
 * with sections in the current semester.
 */
export async function fetchCourseList(semesterId?: string): Promise<Array<{ value: string; label: string }>> {
  try {
    const params = new URLSearchParams()
    if (semesterId) params.set('semesterId', semesterId)
    const qs = params.toString()
    const courses = await apiRequest<
      | Array<{ code: string; name: string; credits: number }>
      | { items: Array<{ code: string; name: string; credits: number }> }
    >(`/courses${qs ? `?${qs}` : ''}`)

    const list = Array.isArray(courses) ? courses : courses.items
    return list
      .map((c) => ({
        value: c.code,
        label: `${c.code} - ${c.name} (${c.credits} TC)`,
      }))
      .sort((a, b) => a.value.localeCompare(b.value))
  } catch {
    return []
  }
}
