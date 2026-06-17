import { ApiPropertyOptional } from '@nestjs/swagger'
import { WishStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class WishQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  studentId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  courseCode?: string

  @ApiPropertyOptional({ enum: WishStatus })
  @IsEnum(WishStatus)
  @IsOptional()
  status?: WishStatus
}
