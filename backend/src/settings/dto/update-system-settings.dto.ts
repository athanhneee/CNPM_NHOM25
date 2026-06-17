import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator'

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

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxCreditsMain?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxCreditsSummer?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  minCredits?: number

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  maintenanceMode?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowWaitlist?: boolean
  
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  countWaitlistCredits?: boolean

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowGradeImprovement?: boolean

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxRetakeAttempts?: number

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
