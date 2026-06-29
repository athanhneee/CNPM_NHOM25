import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export enum CourseOptionsMode {
  BY_COURSE = 'BY_COURSE',
  OPEN_FOR_STUDENT_CLASS = 'OPEN_FOR_STUDENT_CLASS',
  CURRICULUM_PLAN = 'CURRICULUM_PLAN',
  NOT_STUDIED_IN_CURRICULUM = 'NOT_STUDIED_IN_CURRICULUM',
  FAILED_COURSES = 'FAILED_COURSES',
  BY_DEPARTMENT = 'BY_DEPARTMENT',
  BY_SECTION = 'BY_SECTION',
}

export class CourseOptionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Student ID (required for admin/academic, auto-resolved for students)' })
  @IsString()
  @IsOptional()
  studentId?: string

  @ApiPropertyOptional({ description: 'Student class code (e.g. D23CQCN01-N)' })
  @IsString()
  @IsOptional()
  studentClassCode?: string

  @ApiProperty({ enum: CourseOptionsMode, description: 'Filter mode' })
  @IsEnum(CourseOptionsMode)
  mode: CourseOptionsMode

  @ApiPropertyOptional({ description: 'Term/semester ID (defaults to current)' })
  @IsString()
  @IsOptional()
  termId?: string

  @ApiPropertyOptional({ description: 'Course code for BY_COURSE mode' })
  @IsString()
  @IsOptional()
  courseCode?: string

  @ApiPropertyOptional({ description: 'Department/faculty for BY_DEPARTMENT mode' })
  @IsString()
  @IsOptional()
  department?: string

  @ApiPropertyOptional({ description: 'Section code for BY_SECTION mode' })
  @IsString()
  @IsOptional()
  sectionCode?: string

  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsString()
  @IsOptional()
  keyword?: string
}
