import { Injectable, NotFoundException } from '@nestjs/common'
import { AuditActor, appendAuditLog } from '../common/utils/audit'
import { PrismaService } from '../prisma/prisma.service'
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto'

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getCurrentSettings() {
    const settings = await this.prisma.systemSetting.findUnique({
      where: { id: 1 },
    })

    if (!settings) {
      throw new NotFoundException('Chưa cấu hình tham số hệ thống.')
    }

    return settings
  }

  async updateSettings(updateDto: UpdateSystemSettingsDto, actor: AuditActor) {
    const settings = await this.prisma.systemSetting.update({
      where: { id: 1 },
      data: {
        simulationNow: updateDto.simulationNow ? new Date(updateDto.simulationNow) : undefined,
        registrationStart: updateDto.registrationStart ? new Date(updateDto.registrationStart) : undefined,
        registrationEnd: updateDto.registrationEnd ? new Date(updateDto.registrationEnd) : undefined,
        adjustmentStart: updateDto.adjustmentStart ? new Date(updateDto.adjustmentStart) : undefined,
        adjustmentEnd: updateDto.adjustmentEnd ? new Date(updateDto.adjustmentEnd) : undefined,
        withdrawalDeadline: updateDto.withdrawalDeadline ? new Date(updateDto.withdrawalDeadline) : undefined,
        maxCredits: updateDto.maxCredits,
        minCredits: updateDto.minCredits,
        maintenanceMode: updateDto.maintenanceMode,
        allowWaitlist: updateDto.allowWaitlist,
        sessionTimeoutMinutes: updateDto.sessionTimeoutMinutes,
        warningBeforeLogoutSeconds: updateDto.warningBeforeLogoutSeconds,
        maxClassesPerDay: updateDto.maxClassesPerDay,
        maxClassesPerSemester: updateDto.maxClassesPerSemester,
        currentSemesterId: updateDto.currentSemesterId,
        maintenanceMessage: updateDto.maintenanceMessage,
      },
    })

    await appendAuditLog(this.prisma, actor, 'UPDATE_SETTINGS', 'system-settings', 'SUCCESS', 'Cập nhật tham số hệ thống.')
    return settings
  }

  async getSemesterOptions() {
    return this.prisma.semesterOption.findMany({ orderBy: [{ isCurrent: 'desc' }, { label: 'asc' }] })
  }

  async getSemesterOption(id: string) {
    const semester = await this.prisma.semesterOption.findUnique({ where: { id } })
    if (!semester) {
      throw new NotFoundException('Không tìm thấy học kỳ.')
    }

    return semester
  }
}
