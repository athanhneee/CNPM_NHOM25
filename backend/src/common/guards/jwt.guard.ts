import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import * as jwt from 'jsonwebtoken'
import { normalizeRoles } from '../utils/public-user'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
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
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) {
        throw new InternalServerErrorException('JWT_SECRET is not configured')
      }
      const payload = jwt.verify(token, secret) as Record<string, any>
      request.user = {
        ...payload,
        userId: payload.userId ?? payload.sub,
        roles: normalizeRoles(payload.roles),
      }
      return true
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error
      }
      throw new UnauthorizedException('Invalid or expired token')
    }
  }
}
