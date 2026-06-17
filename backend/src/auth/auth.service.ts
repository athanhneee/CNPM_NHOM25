import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { AuditResult, User } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { appendAuditLog } from '../common/utils/audit'
import { normalizeRoles, primaryRole, toPublicUser } from '../common/utils/public-user'
import { parseDurationMs } from '../common/utils/time'
import { PrismaService } from '../prisma/prisma.service'

const MAX_FAILED_LOGIN_ATTEMPTS = 5

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  private jwtSecret() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET is not configured')
    }

    return secret
  }

  private accessTokenExpiresIn() {
    return process.env.JWT_EXPIRES_IN ?? '15m'
  }

  private refreshTokenExpiresIn() {
    return process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d'
  }

  private buildSession(userId: string, rememberMe: boolean, expiresAt: Date) {
    return {
      userId,
      expiresAt: expiresAt.toISOString(),
      lastActivityAt: new Date().toISOString(),
      rememberMe,
    }
  }

  private signAccessToken(user: User) {
    const roles = normalizeRoles(user.roles)
    return jwt.sign(
      {
        sub: user.id,
        userId: user.id,
        username: user.username,
        roles,
        email: user.email,
      },
      this.jwtSecret(),
      { expiresIn: this.accessTokenExpiresIn() as jwt.SignOptions['expiresIn'] },
    )
  }

  private signRefreshToken(user: User) {
    return jwt.sign({ sub: user.id, tokenType: 'refresh' }, this.jwtSecret(), {
      expiresIn: this.refreshTokenExpiresIn() as jwt.SignOptions['expiresIn'],
    })
  }

  private async auditForUser(
    user: User,
    action: string,
    result: AuditResult,
    message: string,
    metadata?: Record<string, string | number | boolean | null>,
  ) {
    await appendAuditLog(
      this.prisma,
      { actorId: user.id, actorRole: primaryRole(user.roles) },
      action,
      user.id,
      result,
      message,
      metadata,
    )
  }

  async validateUser(identifier: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    })

    if (!user) {
      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu.')
    }

    const isValid = await bcrypt.compare(password, user.passwordDigest)
    if (!isValid) {
      const failedLoginAttempts = user.failedLoginAttempts + 1
      const shouldLock = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS

      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts,
          status: shouldLock ? 'LOCKED' : user.status,
        },
      })

      await this.auditForUser(
        updatedUser,
        'LOGIN_FAILED',
        shouldLock ? 'WARNING' : 'FAILURE',
        shouldLock
          ? 'Đăng nhập sai quá số lần cho phép, tài khoản đã bị khóa.'
          : 'Sai tài khoản hoặc mật khẩu.',
        { failedLoginAttempts },
      )

      throw new UnauthorizedException('Sai tài khoản hoặc mật khẩu.')
    }

    if (user.status !== 'ACTIVE') {
      await this.auditForUser(
        user,
        'LOGIN_FAILED',
        'FAILURE',
        'Tài khoản đang bị khóa hoặc tạm ngưng.',
      )
      throw new UnauthorizedException('Tài khoản đang bị khóa hoặc tạm ngưng.')
    }

    return user
  }

  async login(identifier: string, password: string, rememberMe: boolean) {
    const user = await this.validateUser(identifier.trim(), password)
    const accessToken = this.signAccessToken(user)
    const refreshToken = this.signRefreshToken(user)
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10)

    let sessionExpiresAt: Date
    if (rememberMe) {
      sessionExpiresAt = new Date(
        Date.now() + parseDurationMs(this.refreshTokenExpiresIn(), 7 * 24 * 60 * 60 * 1000),
      )
    } else {
      const settings = await this.prisma.systemSetting.findUnique({ where: { id: 1 } })
      const timeoutMinutes = settings?.sessionTimeoutMinutes ?? 30
      sessionExpiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000)
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshTokenHash,
        refreshTokenExpiresAt: sessionExpiresAt,
        failedLoginAttempts: 0,
        lastLoginAt: new Date(),
      },
    })

    await this.auditForUser(updatedUser, 'LOGIN_SUCCESS', 'SUCCESS', 'Đăng nhập thành công.')

    return {
      success: true,
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiresIn(),
      sessionExpiresAt: sessionExpiresAt.toISOString(),
      session: this.buildSession(updatedUser.id, rememberMe, sessionExpiresAt),
      user: toPublicUser(updatedUser),
    }
  }

  async refreshToken(refreshToken: string, requestedUserId?: string) {
    let payload: Record<string, unknown>

    try {
      payload = jwt.verify(refreshToken, this.jwtSecret()) as Record<string, unknown>
    } catch {
      throw new UnauthorizedException('Refresh token hết hạn hoặc không hợp lệ.')
    }

    if (payload.tokenType !== 'refresh' || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Refresh token không hợp lệ.')
    }

    if (requestedUserId && requestedUserId !== payload.sub) {
      throw new UnauthorizedException('Refresh token không thuộc tài khoản này.')
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token không hợp lệ.')
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đang bị khóa hoặc tạm ngưng.')
    }

    if (user.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token đã hết hạn.')
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken)
    if (!isValid) {
      throw new UnauthorizedException('Refresh token không hợp lệ.')
    }

    return {
      accessToken: this.signAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: this.accessTokenExpiresIn(),
      user: toPublicUser(user),
    }
  }

  async logout(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    })

    await this.auditForUser(user, 'LOGOUT', 'INFO', 'Đăng xuất khỏi hệ thống.')
    return { success: true }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.')
    }

    return toPublicUser(user)
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản người dùng.')
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordDigest)
    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.')
    }

    const passwordDigest = await bcrypt.hash(newPassword, 10)
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordDigest,
        failedLoginAttempts: 0,
        refreshToken: null,
        refreshTokenExpiresAt: null,
      },
    })

    await this.auditForUser(updatedUser, 'CHANGE_PASSWORD', 'SUCCESS', 'Đổi mật khẩu thành công.')
    return { success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', requireRelogin: true }
  }
}
