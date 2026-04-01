import type { AccountStatus, UserRole } from '@/types/auth'

export interface User {
  id: string
  username: string
  email: string
  fullName: string
  phone: string
  secondaryEmail?: string
  roles: UserRole[]
  status: AccountStatus
  campus: string
  department: string
  code: string
  passwordDigest: string
  failedLoginAttempts: number
  lastLoginAt?: string
  dateOfBirth?: string
  gender?: string
  citizenId?: string
  nationality?: string
  ethnicity?: string
  religion?: string
  birthPlace?: string
  address?: string
  homeTown?: string
  program?: string
  cohort?: string
  faculty?: string
  majorCode?: string
  majorName?: string
  studentClass?: string
  educationProgram?: string
  academicPeriod?: string
  studentStatus?: string
  classificationStatus?: 'MAPPED' | 'REVIEW'
  assignedSectionIds?: string[]
  title?: string
  position?: string
  specialization?: string
  yearLevel?: string
  gpa?: number
  attendanceRate?: number
  completedCredits?: number
  interests?: string[]
  bio?: string
  avatarUrl?: string
}
