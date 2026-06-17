import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { EnrollmentStatus } from '@prisma/client'
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'

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
}

export class WithdrawEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string
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
