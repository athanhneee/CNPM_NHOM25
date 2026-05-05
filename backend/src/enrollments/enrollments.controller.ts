import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { CreateEnrollmentDto, RegisterEnrollmentDto, CheckEligibilityDto } from './dto/create-enrollment.dto'
import {
  EnrollmentReasonDto,
  OverrideEnrollmentDto,
  UpdateEnrollmentDto,
  WithdrawEnrollmentDto,
} from './dto/update-enrollment.dto'
import { EnrollmentsService } from './enrollments.service'

@ApiTags('enrollments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  private resolveStudentId(user: RequestUser, requestedStudentId?: string) {
    const isStudentOnly =
      user.roles.includes('STUDENT') &&
      !user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(role))

    if (isStudentOnly && requestedStudentId && requestedStudentId !== user.userId) {
      throw new ForbiddenException('Sinh viên chỉ được thao tác trên đăng ký của chính mình.')
    }

    return requestedStudentId ?? user.userId
  }

  @ApiOperation({ summary: 'Danh sách đăng ký học phần' })
  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: Record<string, any>) {
    const isStudentOnly =
      user.roles.includes('STUDENT') &&
      !user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE', 'LECTURER'].includes(role))
    return this.enrollmentsService.findAll({
      ...query,
      studentId: isStudentOnly ? user.userId : query.studentId,
    })
  }

  @ApiOperation({ summary: 'Kiểm tra điều kiện đăng ký học phần' })
  @Post('eligibility')
  async checkEligibility(@CurrentUser() user: RequestUser, @Body() body: CheckEligibilityDto) {
    return this.enrollmentsService.checkEligibility(this.resolveStudentId(user, body.studentId), body.sectionId)
  }

  @ApiOperation({ summary: 'Đăng ký lớp học phần' })
  @Post('register')
  async register(@CurrentUser() user: RequestUser, @Body() body: RegisterEnrollmentDto) {
    return this.enrollmentsService.registerSection(
      this.resolveStudentId(user, body.studentId),
      body.sectionId,
      buildActor(user),
    )
  }

  @ApiOperation({ summary: 'Academic/Admin override đăng ký học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('override')
  async override(@CurrentUser() user: RequestUser, @Body() body: OverrideEnrollmentDto) {
    return this.enrollmentsService.overrideEnrollment(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Xử lý danh sách chờ của một lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('sections/:sectionId/process-waitlist')
  async processWaitlist(@CurrentUser() user: RequestUser, @Param('sectionId') sectionId: string) {
    return this.enrollmentsService.processWaitlist(sectionId, buildActor(user))
  }

  @ApiOperation({ summary: 'Chi tiết đăng ký học phần' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.enrollmentsService.findOne(id)
  }

  @ApiOperation({ summary: 'Tạo đăng ký học phần, tương thích endpoint cũ' })
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Hủy đăng ký trong cửa sổ điều chỉnh' })
  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: EnrollmentReasonDto,
  ) {
    return this.enrollmentsService.cancelEnrollment(id, buildActor(user), body.reason)
  }

  @ApiOperation({ summary: 'Rút học phần trước hạn rút' })
  @Post(':id/withdraw')
  async withdraw(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: WithdrawEnrollmentDto,
  ) {
    return this.enrollmentsService.withdrawEnrollment(id, buildActor(user), body.reason)
  }

  @ApiOperation({ summary: 'Cập nhật trạng thái đăng ký' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return this.enrollmentsService.update(id, updateEnrollmentDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Xóa bản ghi đăng ký' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.enrollmentsService.remove(id, buildActor(user))
  }
}
