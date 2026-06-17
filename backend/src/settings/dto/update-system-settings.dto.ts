import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateSystemSettingsDto {
  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  simulationNow?: string

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  registrationStart?: string

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  registrationEnd?: string

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  adjustmentStart?: string

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  adjustmentEnd?: string

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  withdrawalDeadline?: string

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxCredits?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  minCredits?: number

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  allowWaitlist?: boolean

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  sessionTimeoutMinutes?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  warningBeforeLogoutSeconds?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxClassesPerDay?: number

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxClassesPerSemester?: number

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  currentSemesterId?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  maintenanceMessage?: string
}
