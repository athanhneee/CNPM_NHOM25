import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LoginDto {
  @ApiProperty({ description: 'Username or email' })
  @IsString()
  @IsNotEmpty()
  identifier: string

  @ApiProperty({ description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string

  @ApiProperty({ description: 'Remember me flag', required: false })
  @IsBoolean()
  @IsOptional()
  rememberMe = false
}
