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

  private assertCanReadStudent(user: RequestUser, studentId: string) {
    const privileged = user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(role))
    if (user.roles.includes('STUDENT') && !privileged && user.userId !== studentId) {
      throw new ForbiddenException('Sinh viên chỉ được xem lịch của chính mình.')
    }
  }

  private assertCanReadLecturer(user: RequestUser, lecturerId: string) {
    const privileged = user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(role))
    if (user.roles.includes('LECTURER') && !privileged && user.userId !== lecturerId) {
      throw new ForbiddenException('Giảng viên chỉ được xem lịch giảng dạy của chính mình.')
    }
  }

  @ApiOperation({ summary: 'Tất cả lớp học phần trong một học kỳ' })
  @Get('semester/:semesterId')
  async findSemesterSchedule(@Param('semesterId') semesterId: string) {
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
