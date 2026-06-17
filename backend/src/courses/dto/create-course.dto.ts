import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { CourseCategory, CourseStatus } from '@prisma/client'
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  credits: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  campus: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string

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
