import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class RefreshTokenDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  userId?: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
