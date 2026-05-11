import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateWishDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  courseCode: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredGroup?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string
}
