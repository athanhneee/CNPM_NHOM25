import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { ReportQueryDto } from './dto/report-query.dto'
import { ReportsService } from './reports.service'

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'ACADEMIC_OFFICE')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Báo cáo tổng hợp đăng ký theo lớp học phần' })
  @Get('registration-summary')
  async getRegistrationSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getRegistrationSummary(query.semesterId)
  }

  @ApiOperation({ summary: 'Thống kê tỷ lệ lấp đầy lớp học phần' })
  @Get('utilization-stats')
  async getUtilizationStats(@Query() query: ReportQueryDto) {
    return this.reportsService.getUtilizationStats(query.semesterId)
  }
}
