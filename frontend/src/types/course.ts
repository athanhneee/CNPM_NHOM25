export type CourseStatus = 'ACTIVE' | 'INACTIVE'

export interface Course {
  id: string
  code: string
  name: string
  credits: number
  status: CourseStatus
  department: string
  campus: string
  description: string
  prerequisites: string[]
  prestudy: string[]
  corequisites: string[]
  category: 'FOUNDATION' | 'CORE' | 'ELECTIVE' | 'THESIS'
  faculty?: string
  courseType?: 'Đại cương' | 'Cơ sở ngành' | 'Chuyên ngành' | 'Tự chọn' | 'Đồ án'
  academicBlock?:
    | 'generalEducationCourses'
    | 'foundationCourses'
    | 'majorCoreCourses'
    | 'specializationCourses'
    | 'electiveCourses'
  suggestedSemester?: number
  lectureHours?: number
  practiceHours?: number
  labHours?: number
  passingScore?: number
  maxStudents?: number
  classSectionCount?: number
  gradingWeight?: {
    attendance?: number
    midterm?: number
    project?: number
    practice?: number
    final?: number
  }
  majorsSupported?: string[]
  majorCodesSupported?: string[]
  track?: string
  applicableSpecializations?: string[]
}

export interface CourseRelationRow {
  id: string
  courseCode: string
  courseName: string
  requiredCourseCode: string
  requiredCourseName: string
  relationType: 'PREREQUISITE' | 'PRESTUDY' | 'COREQUISITE'
  program: string
  department: string
}

export interface WishRequest {
  id: string
  studentId: string
  semesterId: string
  courseCode: string
  preferredGroup?: string
  reason: string
  createdAt: string
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
}
