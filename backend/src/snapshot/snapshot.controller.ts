import { Controller, ForbiddenException, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { SnapshotService } from './snapshot.service'

@ApiTags('snapshot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('snapshot')
export class SnapshotController {
  constructor(private snapshotService: SnapshotService) {}

  @ApiOperation({ summary: 'Export snapshot dữ liệu demo, không bao gồm secret người dùng' })
  @Get('export')
  async exportSnapshot() {
    return this.snapshotService.exportSnapshot()
  }

  @ApiOperation({ summary: 'Import snapshot dữ liệu demo' })
  @Post('import')
  async importSnapshot() {
    throw new ForbiddenException('Tính năng import dữ liệu đã bị khóa trong môi trường production để bảo mật.');
  }

  @ApiOperation({ summary: 'Xóa dữ liệu demo hiện tại' })
  @Post('reset')
  async resetSeed() {
    throw new ForbiddenException('Tính năng này đã bị khóa vì lý do bảo mật.')
  }
}
