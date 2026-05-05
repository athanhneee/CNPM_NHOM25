import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateEnrollmentDto {
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
  semesterId: string
}

export class RegisterEnrollmentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  studentId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sectionId: string
}

export class CheckEligibilityDto extends RegisterEnrollmentDto {}
