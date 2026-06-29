import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { LearningMode, SectionStatus } from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Max,
  Min,
} from 'class-validator'

export class CreateSectionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionCode: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseCode: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  semesterId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  group: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  subGroup?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lecturerId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guestLecturer?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  room: string

  @ApiProperty()
  @IsInt()
  @Min(2)
  @Max(8)
  weekday: number

  @ApiProperty()
  @IsInt()
  @Min(1)
  startPeriod: number

  @ApiProperty()
  @IsInt()
  @Min(1)
  periodCount: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  weeks: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  capacity: number

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowWaitlist?: boolean

  @ApiPropertyOptional({ enum: SectionStatus })
  @IsEnum(SectionStatus)
  @IsOptional()
  status?: SectionStatus

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campus?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  examSlot?: string

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: Date

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: Date

  @ApiPropertyOptional({ enum: LearningMode })
  @IsEnum(LearningMode)
  @IsOptional()
  learningMode?: LearningMode
}
