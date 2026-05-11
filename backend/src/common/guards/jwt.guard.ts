import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { PrismaService } from '../../prisma/prisma.service'
import { normalizeRoles } from '../utils/public-user'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers['authorization'] || request.headers['Authorization']
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header')
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization format')
    }

    const token = parts[1]
    let payload: Record<string, any>

    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new InternalServerErrorException('JWT_SECRET is not configured')
      }
      payload = jwt.verify(token, secret) as Record<string, any>
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error
      }
      throw new UnauthorizedException('Invalid or expired token')
    }

    const userId = payload.userId ?? payload.sub
    if (typeof userId !== 'string') {
      throw new UnauthorizedException('Invalid token payload')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        roles: true,
        status: true,
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is locked or inactive')
    }

    request.user = {
      ...payload,
      sub: user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: normalizeRoles(user.roles),
    }
    return true
  }
}
