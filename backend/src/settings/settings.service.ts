import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
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
    const currentSettings = await this.getCurrentSettings()

    const registrationStart = updateDto.registrationStart ? new Date(updateDto.registrationStart) : currentSettings.registrationStart
    const registrationEnd = updateDto.registrationEnd ? new Date(updateDto.registrationEnd) : currentSettings.registrationEnd
    const adjustmentStart = updateDto.adjustmentStart ? new Date(updateDto.adjustmentStart) : currentSettings.adjustmentStart
    const adjustmentEnd = updateDto.adjustmentEnd ? new Date(updateDto.adjustmentEnd) : currentSettings.adjustmentEnd
    const withdrawalDeadline = updateDto.withdrawalDeadline ? new Date(updateDto.withdrawalDeadline) : currentSettings.withdrawalDeadline
    
    if (registrationStart && registrationEnd && registrationStart >= registrationEnd) {
      throw new BadRequestException('Thời gian bắt đầu đăng ký phải trước thời gian kết thúc.')
    }
    if (adjustmentStart && adjustmentEnd && adjustmentStart > adjustmentEnd) {
      throw new BadRequestException('Thời gian bắt đầu điều chỉnh phải trước hoặc bằng thời gian kết thúc.')
    }
    if (registrationEnd && adjustmentStart && registrationEnd > adjustmentStart) {
      throw new BadRequestException('Thời gian kết thúc đăng ký phải trước hoặc bằng thời gian bắt đầu điều chỉnh.')
    }
    if (withdrawalDeadline && adjustmentStart && withdrawalDeadline < adjustmentStart) {
      throw new BadRequestException('Hạn rút học phần không được trước thời gian bắt đầu điều chỉnh.')
    }

    const minCredits = updateDto.minCredits ?? currentSettings.minCredits
    const maxCreditsMain = updateDto.maxCreditsMain ?? currentSettings.maxCreditsMain
    const maxCreditsSummer = updateDto.maxCreditsSummer ?? currentSettings.maxCreditsSummer
    if (minCredits > maxCreditsMain) {
      throw new BadRequestException('Số tín chỉ tối thiểu không được lớn hơn số tín chỉ tối đa học kỳ chính.')
    }
    if (minCredits > maxCreditsSummer) {
      throw new BadRequestException('Số tín chỉ tối thiểu không được lớn hơn số tín chỉ tối đa học kỳ hè.')
    }

    if (maxCreditsMain <= 0 || maxCreditsSummer <= 0) {
      throw new BadRequestException('Số tín chỉ tối đa phải lớn hơn 0.')
    }

    const sessionTimeoutMinutes = updateDto.sessionTimeoutMinutes ?? currentSettings.sessionTimeoutMinutes
    if (sessionTimeoutMinutes <= 0) {
      throw new BadRequestException('Timeout phiên phải lớn hơn 0.')
    }

    const warningBeforeLogoutSeconds = updateDto.warningBeforeLogoutSeconds ?? currentSettings.warningBeforeLogoutSeconds
    if (warningBeforeLogoutSeconds <= 0) {
      throw new BadRequestException('Thời gian cảnh báo trước khi logout phải lớn hơn 0.')
    }

    if (updateDto.currentSemesterId) {
      const semester = await this.prisma.semesterOption.findUnique({ where: { id: updateDto.currentSemesterId } })
      if (!semester) {
        throw new BadRequestException('Học kỳ hiện tại không hợp lệ.')
      }
    }

    const settings = await this.prisma.$transaction(async (tx) => {
      if (updateDto.currentSemesterId && updateDto.currentSemesterId !== currentSettings.currentSemesterId) {
        await tx.semesterOption.updateMany({ data: { isCurrent: false } })
        await tx.semesterOption.update({
          where: { id: updateDto.currentSemesterId },
          data: { isCurrent: true },
        })
      }

      return tx.systemSetting.update({
        where: { id: 1 },
        data: {
          simulationNow: updateDto.simulationNow ? new Date(updateDto.simulationNow) : undefined,
          registrationStart: updateDto.registrationStart ? new Date(updateDto.registrationStart) : undefined,
          registrationEnd: updateDto.registrationEnd ? new Date(updateDto.registrationEnd) : undefined,
          adjustmentStart: updateDto.adjustmentStart ? new Date(updateDto.adjustmentStart) : undefined,
          adjustmentEnd: updateDto.adjustmentEnd ? new Date(updateDto.adjustmentEnd) : undefined,
          withdrawalDeadline: updateDto.withdrawalDeadline ? new Date(updateDto.withdrawalDeadline) : undefined,
          maxCreditsMain: updateDto.maxCreditsMain,
          maxCreditsSummer: updateDto.maxCreditsSummer,
          minCredits: updateDto.minCredits,
          maintenanceMode: updateDto.maintenanceMode,
          allowWaitlist: updateDto.allowWaitlist,
          allowGradeImprovement: updateDto.allowGradeImprovement,
          maxRetakeAttempts: updateDto.maxRetakeAttempts,
          sessionTimeoutMinutes: updateDto.sessionTimeoutMinutes,
          warningBeforeLogoutSeconds: updateDto.warningBeforeLogoutSeconds,
          maxClassesPerDay: updateDto.maxClassesPerDay,
          maxClassesPerSemester: updateDto.maxClassesPerSemester,
          currentSemesterId: updateDto.currentSemesterId,
          maintenanceMessage: updateDto.maintenanceMessage,
        },
      })
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
