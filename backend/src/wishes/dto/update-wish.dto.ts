import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { WishStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateWishStatusDto {
  @ApiProperty({ enum: WishStatus })
  @IsEnum(WishStatus)
  status: WishStatus

  @ApiPropertyOptional({ description: 'Lý do/phản hồi khi duyệt hoặc từ chối nguyện vọng.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string
}
