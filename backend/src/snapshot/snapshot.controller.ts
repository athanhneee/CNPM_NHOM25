import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
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
  async importSnapshot(@Body() body: any) {
    return this.snapshotService.importSnapshot(body)
  }

  @ApiOperation({ summary: 'Xóa dữ liệu demo hiện tại' })
  @Post('reset')
  async resetSeed() {
    return this.snapshotService.resetSeed()
  }
}
