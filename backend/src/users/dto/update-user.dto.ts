import { ApiPropertyOptional } from '@nestjs/swagger'
import { AccountStatus, UserRole } from '@prisma/client'
import { IsArray, IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  username?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullName?: string

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  secondaryEmail?: string

  @ApiPropertyOptional({ enum: UserRole, isArray: true })
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[]

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campus?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  faculty?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  majorCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  majorName?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentClass?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentStatus?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  position?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialization?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  yearLevel?: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  gpa?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  attendanceRate?: number

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  completedCredits?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bio?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string
}
