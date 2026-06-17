import { ApiPropertyOptional } from '@nestjs/swagger'
import { CourseCategory, CourseStatus } from '@prisma/client'
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class UpdateCourseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  credits?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campus?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  prerequisites?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  prestudy?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  corequisites?: string[]

  @ApiPropertyOptional({ enum: CourseCategory })
  @IsEnum(CourseCategory)
  @IsOptional()
  category?: CourseCategory

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  faculty?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courseType?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  academicBlock?: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  suggestedSemester?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  lectureHours?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  practiceHours?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  labHours?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  passingScore?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxStudents?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  classSectionCount?: number

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  majorsSupported?: string[]

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  majorCodesSupported?: string[]

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  track?: string

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  applicableSpecializations?: string[]
}
