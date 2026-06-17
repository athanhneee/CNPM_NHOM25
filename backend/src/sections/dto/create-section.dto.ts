import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { SectionStatus } from '@prisma/client'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lecturerId: string

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
}
