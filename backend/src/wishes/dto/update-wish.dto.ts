import { ApiProperty } from '@nestjs/swagger'
import { WishStatus } from '@prisma/client'
import { IsEnum } from 'class-validator'

export class UpdateWishStatusDto {
  @ApiProperty({ enum: WishStatus })
  @IsEnum(WishStatus)
  status: WishStatus
}
