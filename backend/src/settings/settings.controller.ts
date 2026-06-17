import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { SkipMaintenance } from '../common/decorators/skip-maintenance.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto'
import { SettingsService } from './settings.service'

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiOperation({ summary: 'Tham số hệ thống hiện tại' })
  @Get()
  async getCurrentSettings() {
    return this.settingsService.getCurrentSettings()
  }

  @ApiOperation({ summary: 'Cập nhật tham số hệ thống' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @SkipMaintenance()
  @Patch()
  async updateSettings(@CurrentUser() user: RequestUser, @Body() body: UpdateSystemSettingsDto) {
    return this.settingsService.updateSettings(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Danh sách học kỳ' })
  @Get('semesters')
  async getSemesterOptions() {
    return this.settingsService.getSemesterOptions()
  }

  @ApiOperation({ summary: 'Chi tiết học kỳ' })
  @Get('semesters/:id')
  async getSemesterOption(@Param('id') id: string) {
    return this.settingsService.getSemesterOption(id)
  }
}
