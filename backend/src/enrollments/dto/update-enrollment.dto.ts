import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { EnrollmentStatus } from '@prisma/client'
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reasonCode?: string
}

export class EnrollmentReasonDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  force?: boolean
}

export class OverrideEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  studentId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string
}

export class TransferEnrollmentDto {
  @ApiProperty({ description: 'ID sinh viên cần chuyển lớp' })
  @IsString()
  @IsNotEmpty()
  studentId: string

  @ApiProperty({ description: 'ID lớp học phần hiện tại' })
  @IsString()
  @IsNotEmpty()
  fromSectionId: string

  @ApiProperty({ description: 'ID lớp học phần đích' })
  @IsString()
  @IsNotEmpty()
  toSectionId: string

  @ApiProperty({ description: 'Lý do chuyển lớp' })
  @IsString()
  @IsNotEmpty()
  reason: string
}

