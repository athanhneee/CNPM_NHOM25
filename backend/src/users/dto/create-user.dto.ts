import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AccountStatus, UserRole } from '@prisma/client'
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  code?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string

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
  @MinLength(8)
  @IsOptional()
  password?: string
}
