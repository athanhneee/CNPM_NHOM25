import { ApiPropertyOptional } from '@nestjs/swagger'
import { CourseCategory, CourseStatus } from '@prisma/client'
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator'
import { Transform } from 'class-transformer'
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

  @ApiPropertyOptional({ description: 'Mã lớp sinh viên (vd: D23CQCN01-N) để lọc môn theo ngành' })
  @IsString()
  @IsOptional()
  studentClass?: string

  @ApiPropertyOptional({ description: 'Học kỳ đề xuất trong CTĐT (1-8)' })
  @Transform(({ value }) => value !== undefined ? Number(value) : undefined)
  @IsInt()
  @IsOptional()
  suggestedSemester?: number
}
