import { ApiPropertyOptional } from '@nestjs/swagger'
import { AuditResult } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto'

export class LogQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  actorId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  targetId?: string

  @ApiPropertyOptional({ enum: AuditResult })
  @IsEnum(AuditResult)
  @IsOptional()
  result?: AuditResult

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  action?: string

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  from?: string

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  to?: string
}
