import { ApiPropertyOptional } from '@nestjs/swagger'
import { EnrollmentStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class EnrollmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sectionId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string

  @ApiPropertyOptional({ enum: EnrollmentStatus })
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus
}
