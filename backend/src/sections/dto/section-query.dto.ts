import { ApiPropertyOptional } from '@nestjs/swagger'
import { SectionStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class SectionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courseCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lecturerId?: string

  @ApiPropertyOptional({ enum: SectionStatus })
  @IsEnum(SectionStatus)
  @IsOptional()
  status?: SectionStatus

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  campus?: string
}
