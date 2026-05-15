import { ApiPropertyOptional } from '@nestjs/swagger'
import { CourseCategory, CourseStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class CourseQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  department?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campus?: string

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsEnum(CourseStatus)
  @IsOptional()
  status?: CourseStatus

  @ApiPropertyOptional({ enum: CourseCategory })
  @IsEnum(CourseCategory)
  @IsOptional()
  category?: CourseCategory

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string
}
