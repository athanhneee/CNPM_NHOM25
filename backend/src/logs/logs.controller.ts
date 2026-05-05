import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { LogsService } from './logs.service'

@ApiTags('logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACADEMIC_OFFICE')
@Controller('logs')
export class LogsController {
  constructor(private logsService: LogsService) {}

  @ApiOperation({ summary: 'Danh sách audit log' })
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    return this.logsService.findAll(query)
  }
}
