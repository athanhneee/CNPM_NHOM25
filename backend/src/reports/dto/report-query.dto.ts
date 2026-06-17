import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'

export class ReportQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  semesterId?: string
}
