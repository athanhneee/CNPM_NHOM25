import { Controller, ForbiddenException, Get, Param, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RequestUser } from '../common/types/request-user'
import { SchedulesService } from './schedules.service'

@ApiTags('schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private schedulesService: SchedulesService) {}

  private isPrivileged(user: RequestUser) {
    return user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(role))
  }

  private assertCanReadSemesterSchedule(user: RequestUser) {
    if (!this.isPrivileged(user)) {
      throw new ForbiddenException('Chỉ quản trị hoặc phòng đào tạo được xem lịch toàn học kỳ.')
    }
  }

  private assertCanReadStudent(user: RequestUser, studentId: string) {
    if (this.isPrivileged(user)) {
      return
    }

    if (user.roles.includes('STUDENT') && user.userId === studentId) {
      return
    }

    throw new ForbiddenException('Sinh viên chỉ được xem lịch của chính mình.')
  }

  private assertCanReadLecturer(user: RequestUser, lecturerId: string) {
    if (this.isPrivileged(user)) {
      return
    }

    if (user.roles.includes('LECTURER') && user.userId === lecturerId) {
      return
    }

    throw new ForbiddenException('Giảng viên chỉ được xem lịch giảng dạy của chính mình.')
  }

  @ApiOperation({ summary: 'Tất cả lớp học phần trong một học kỳ' })
  @Get('semester/:semesterId')
  async findSemesterSchedule(@CurrentUser() user: RequestUser, @Param('semesterId') semesterId: string) {
    this.assertCanReadSemesterSchedule(user)
    return this.schedulesService.findSemesterSchedule(semesterId)
  }

  @ApiOperation({ summary: 'Lịch tuần của sinh viên' })
  @Get('students/:studentId/week/:semesterId')
  async getStudentWeekSchedule(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('semesterId') semesterId: string,
  ) {
    this.assertCanReadStudent(user, studentId)
    return this.schedulesService.getStudentSchedule(studentId, semesterId)
  }

  @ApiOperation({ summary: 'Lịch học kỳ của sinh viên' })
  @Get('students/:studentId/semester/:semesterId')
  async getStudentSemesterSchedule(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('semesterId') semesterId: string,
  ) {
    this.assertCanReadStudent(user, studentId)
    return this.schedulesService.getStudentSchedule(studentId, semesterId)
  }

  @ApiOperation({ summary: 'Lịch tuần của giảng viên' })
  @Get('lecturers/:lecturerId/week/:semesterId')
  async getLecturerWeekSchedule(
    @CurrentUser() user: RequestUser,
    @Param('lecturerId') lecturerId: string,
    @Param('semesterId') semesterId: string,
  ) {
    this.assertCanReadLecturer(user, lecturerId)
    return this.schedulesService.getLecturerSchedule(lecturerId, semesterId)
  }

  @ApiOperation({ summary: 'Lịch học kỳ của giảng viên' })
  @Get('lecturers/:lecturerId/semester/:semesterId')
  async getLecturerSemesterSchedule(
    @CurrentUser() user: RequestUser,
    @Param('lecturerId') lecturerId: string,
    @Param('semesterId') semesterId: string,
  ) {
    this.assertCanReadLecturer(user, lecturerId)
    return this.schedulesService.getLecturerSchedule(lecturerId, semesterId)
  }
}
