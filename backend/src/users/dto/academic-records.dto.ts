import { ApiProperty } from '@nestjs/swagger'
import { EnrollmentStatus, StudentResultStatus } from '@prisma/client'

export class CompletedCourseDto {
  @ApiProperty()
  courseCode: string

  @ApiProperty()
  courseName: string

  @ApiProperty()
  credits: number

  @ApiProperty({ required: false })
  semesterId?: string

  @ApiProperty({ required: false })
  letterGrade?: string

  @ApiProperty({ required: false })
  numericGrade?: number

  @ApiProperty({ enum: StudentResultStatus })
  status: StudentResultStatus

  @ApiProperty()
  passed: boolean
}

export class OngoingCourseDto {
  @ApiProperty()
  sectionId: string

  @ApiProperty()
  sectionCode: string

  @ApiProperty()
  courseCode: string

  @ApiProperty()
  courseName: string

  @ApiProperty()
  credits: number

  @ApiProperty({ enum: EnrollmentStatus })
  status: EnrollmentStatus
}

export class PendingCourseDto {
  @ApiProperty()
  courseCode: string

  @ApiProperty()
  courseName: string

  @ApiProperty()
  credits: number

  @ApiProperty({ required: false })
  suggestedSemester?: number
}

export class AcademicRecordsDto {
  @ApiProperty({ type: [CompletedCourseDto] })
  completedCourses: CompletedCourseDto[]

  @ApiProperty({ type: [OngoingCourseDto] })
  ongoingCourses: OngoingCourseDto[]

  @ApiProperty({ type: [PendingCourseDto] })
  pendingCourses: PendingCourseDto[]

  @ApiProperty({ type: [String] })
  warnings: string[]
}
