import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { AuthService } from './auth.service'
import { ChangePasswordDto } from './dto/change-password.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Đăng nhập và nhận access/refresh token' })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.identifier, body.password, body.rememberMe)
  }

  @ApiOperation({ summary: 'Làm mới access token' })
  @Post('refresh')
  async refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken, body.userId)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy thông tin người dùng hiện tại' })
  @Get('me')
  async me(@CurrentUser('userId') userId: string) {
    return this.authService.me(userId)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi refresh token' })
  @Post('logout')
  async logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đổi mật khẩu tài khoản hiện tại' })
  @Post('change-password')
  async changePassword(@CurrentUser('userId') userId: string, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(userId, body.currentPassword, body.newPassword)
  }
}
