import type { Course, CourseRelationRow } from '@/types/course'
import type { Section } from '@/types/section'

export interface ParsedStudentRow {
  code: string
  middleName: string
  givenName: string
  fullName: string
}

export interface StudentMajorMapping {
  majorCode: string
  majorName: string
  department: string
  faculty: string
  classificationStatus: 'MAPPED' | 'REVIEW'
  classPrefix: string
  specializationPool: string[]
}

export const CNTT_SPECIALIZATIONS = [
  'Công nghệ phần mềm',
  'Kỹ thuật máy tính',
  'Hệ thống thông tin',
  'Khoa học máy tính',
  'Máy tính và truyền thông dữ liệu',
] as const

export const ATTT_SPECIALIZATIONS = [
  'An toàn mạng',
  'Bảo mật hệ thống',
  'Điều tra số',
  'Quản trị an toàn thông tin',
] as const

export const UNREVIEWED_SPECIALIZATIONS = ['Cần rà soát chương trình'] as const

export const majorPrefixMap: Array<{
  token: string
  mapping: StudentMajorMapping
}> = [
  {
    token: 'DCCN',
    mapping: {
      majorCode: '7480201',
      majorName: 'Công nghệ thông tin',
      department: 'Khoa Công nghệ thông tin',
      faculty: 'Khoa Công nghệ thông tin',
      classificationStatus: 'MAPPED',
      classPrefix: 'CNTT',
      specializationPool: [...CNTT_SPECIALIZATIONS],
    },
  },
  {
    token: 'DCAT',
    mapping: {
      majorCode: '7480202',
      majorName: 'An toàn thông tin',
      department: 'Khoa An toàn thông tin',
      faculty: 'Khoa An toàn thông tin',
      classificationStatus: 'MAPPED',
      classPrefix: 'ATTT',
      specializationPool: [...ATTT_SPECIALIZATIONS],
    },
  },
]

export const unknownMajorMapping: StudentMajorMapping = {
  majorCode: 'UNREVIEWED',
  majorName: 'Chưa phân loại',
  department: 'Nhóm cần rà soát',
  faculty: 'Nhóm cần rà soát',
  classificationStatus: 'REVIEW',
  classPrefix: 'RS',
  specializationPool: [...UNREVIEWED_SPECIALIZATIONS],
}

export function parseStudentSeed(raw: string) {
  return raw
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): ParsedStudentRow | null => {
      const [code = '', middleName = '', givenName = ''] = line.split('\t')
      const trimmedCode = code.trim()
      const trimmedMiddle = middleName.trim()
      const trimmedGiven = givenName.trim()

      if (!trimmedCode || !trimmedMiddle || !trimmedGiven) {
        return null
      }

      return {
        code: trimmedCode,
        middleName: trimmedMiddle,
        givenName: trimmedGiven,
        fullName: `${trimmedMiddle} ${trimmedGiven}`.trim(),
      }
    })
    .filter((row): row is ParsedStudentRow => Boolean(row))
}

export function getMajorMappingFromStudentCode(code: string): StudentMajorMapping {
  const matched = majorPrefixMap.find((entry) => code.includes(entry.token))
  return matched?.mapping ?? unknownMajorMapping
}

export function getAdmissionYear(code: string) {
  return Number(`20${code.slice(1, 3)}`)
}

export function getCohortLabel(code: string) {
  return `K${code.slice(1, 3)}`
}

export function getAcademicPeriod(code: string) {
  const startYear = getAdmissionYear(code)
  return `${startYear}-${startYear + 4}`
}

export function getYearLevel(code: string) {
  const admissionYear = getAdmissionYear(code)
  const diff = Math.max(1, 2026 - admissionYear)
  return `Năm ${Math.min(diff + 1, 5)}`
}

export function getStudentClass(code: string, mapping: StudentMajorMapping) {
  const cohort = code.slice(1, 3)
  return `D${cohort}${mapping.classPrefix}1`
}

export function buildPhone(index: number, prefix = '090') {
  return `${prefix}${String(index + 1).padStart(7, '0')}`
}

export function buildCitizenId(index: number, prefix = '079') {
  return `${prefix}${String(200_000_000 + index).padStart(9, '0')}`.slice(0, 12)
}

export function formatSeedDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function getBirthYearFromStudentCode(code: string) {
  const admissionYear = getAdmissionYear(code)
  if (admissionYear >= 2023) {
    return 2005
  }
  if (admissionYear === 2022) {
    return 2004
  }
  return 2003
}

export function createId(prefix: string, index: number) {
  return `${prefix}${String(index).padStart(3, '0')}`
}

export function buildCourseRelations(courses: Course[]): CourseRelationRow[] {
  const rows: CourseRelationRow[] = []

  for (const course of courses) {
    const relations: Array<{
      codes: string[]
      relationType: CourseRelationRow['relationType']
    }> = [
      { codes: course.prerequisites, relationType: 'PREREQUISITE' },
      { codes: course.prestudy, relationType: 'PRESTUDY' },
      { codes: course.corequisites, relationType: 'COREQUISITE' },
    ]

    for (const relation of relations) {
      for (const requiredCourseCode of relation.codes) {
        const requiredCourse = courses.find((item) => item.code === requiredCourseCode)
        rows.push({
          id: createId('REL', rows.length + 1),
          courseCode: course.code,
          courseName: course.name,
          requiredCourseCode,
          requiredCourseName: requiredCourse?.name ?? requiredCourseCode,
          relationType: relation.relationType,
          program: course.majorsSupported?.join(', ') ?? 'Danh mục PTIT HCM mock',
          department: course.department,
        })
      }
    }
  }

  return rows
}

export function countSectionNumbers(
  sectionTemplates: Array<Pick<Section, 'id'>>,
  enrollments: Array<{
    sectionId: string
    status:
      | 'PENDING'
      | 'REGISTERED'
      | 'CANCELLED'
      | 'REJECTED'
      | 'COMPLETED'
      | 'FAILED'
      | 'WAITLISTED'
      | 'DROPPED'
  }>,
) {
  return sectionTemplates.reduce<Record<string, { registeredCount: number; waitlistCount: number }>>(
    (accumulator, section) => {
      const related = enrollments.filter((enrollment) => enrollment.sectionId === section.id)
      accumulator[section.id] = {
        registeredCount: related.filter((item) =>
          ['REGISTERED', 'COMPLETED', 'FAILED', 'DROPPED'].includes(item.status),
        ).length,
        waitlistCount: related.filter((item) => item.status === 'WAITLISTED').length,
      }
      return accumulator
    },
    {},
  )
}
