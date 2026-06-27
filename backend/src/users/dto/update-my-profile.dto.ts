import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString } from 'class-validator'

/**
 * DTO dành riêng cho sinh viên/người dùng tự cập nhật hồ sơ cá nhân.
 * Chỉ chứa các trường AN TOÀN mà người dùng được phép tự sửa.
 * Các trường học vụ (gpa, completedCredits, majorCode, studentStatus, roles, ...)
 * KHÔNG được phép xuất hiện ở đây — chỉ Admin/Phòng Đào tạo mới được sửa.
 */
export class UpdateMyProfileDto {
  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ description: 'Email phụ' })
  @IsEmail()
  @IsOptional()
  secondaryEmail?: string

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional({ description: 'Tiểu sử ngắn' })
  @IsString()
  @IsOptional()
  bio?: string

  @ApiPropertyOptional({ description: 'URL ảnh đại diện' })
  @IsString()
  @IsOptional()
  avatarUrl?: string
}
