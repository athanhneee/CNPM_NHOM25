import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'
import { LearningMode, SectionStatus } from '@prisma/client'
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator'

export class UpdateSectionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sectionCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courseCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  group?: string

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
  room?: string

  @ApiPropertyOptional()
  @IsInt()
  @Min(2)
  @Max(8)
  @IsOptional()
  weekday?: number

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  startPeriod?: number

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  periodCount?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  weeks?: string

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number

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

export class AssignLecturerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lecturerId: string
}

export class UpdateRoomScheduleDto {
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
}

export class UpdateCapacityDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  capacity: number

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string
}
