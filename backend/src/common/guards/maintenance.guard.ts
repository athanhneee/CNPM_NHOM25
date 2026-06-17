import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'
import { IS_SKIP_MAINTENANCE_KEY } from '../decorators/skip-maintenance.decorator'

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isSkipMaintenance = this.reflector.getAllAndOverride<boolean>(IS_SKIP_MAINTENANCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isSkipMaintenance) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const method = request.method

    // Only block mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true
    }

    const settings = await this.prisma.systemSetting.findUnique({
      where: { id: 1 },
      select: { maintenanceMode: true, maintenanceMessage: true },
    })

    if (settings?.maintenanceMode) {
      throw new HttpException(
        {
          errorCode: 'SYSTEM_MAINTENANCE',
          message: settings.maintenanceMessage || 'Hệ thống đang bảo trì. Vui lòng thử lại sau.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    return true
  }
}
