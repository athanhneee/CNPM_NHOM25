import { seedCourses } from '@/mocks/seed/courses'
import { buildCourseRelations } from '@/mocks/seed/ptit-helpers'

export const seedCourseRelations = buildCourseRelations(seedCourses)
