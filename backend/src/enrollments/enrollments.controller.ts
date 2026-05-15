import {
  BadRequestException,
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
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { CheckEligibilityDto, CreateEnrollmentDto, RegisterEnrollmentDto } from './dto/create-enrollment.dto'
import { EnrollmentQueryDto } from './dto/enrollment-query.dto'
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

  private isPrivileged(user: RequestUser) {
    return user.roles.some((role) => ['ADMIN', 'ACADEMIC_OFFICE'].includes(role))
  }

  private resolveStudentId(user: RequestUser, requestedStudentId?: string) {
    if (this.isPrivileged(user)) {
      if (!requestedStudentId) {
        throw new BadRequestException('studentId is required when acting on behalf of a student.')
      }

      return requestedStudentId
    }

    if (user.roles.includes('STUDENT')) {
      if (requestedStudentId && requestedStudentId !== user.userId) {
        throw new ForbiddenException('Students can only access their own enrollments.')
      }

      return requestedStudentId ?? user.userId
    }

    throw new ForbiddenException('You do not have permission to access enrollments.')
  }

  @ApiOperation({ summary: 'Danh sach dang ky hoc phan' })
  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: EnrollmentQueryDto) {
    if (!this.isPrivileged(user) && !user.roles.includes('STUDENT')) {
      throw new ForbiddenException('You do not have permission to list enrollments.')
    }

    return this.enrollmentsService.findAll({
      ...query,
      studentId: this.isPrivileged(user) ? query.studentId : user.userId,
    })
  }

  @ApiOperation({ summary: 'Kiem tra dieu kien dang ky hoc phan' })
  @Post('eligibility')
  async checkEligibility(@CurrentUser() user: RequestUser, @Body() body: CheckEligibilityDto) {
    return this.enrollmentsService.checkEligibility(this.resolveStudentId(user, body.studentId), body.sectionId)
  }

  @ApiOperation({ summary: 'Dang ky lop hoc phan' })
  @Post('register')
  async register(@CurrentUser() user: RequestUser, @Body() body: RegisterEnrollmentDto) {
    return this.enrollmentsService.registerSection(
      this.resolveStudentId(user, body.studentId),
      body.sectionId,
      buildActor(user),
    )
  }

  @ApiOperation({ summary: 'Academic/Admin override dang ky hoc phan' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('override')
  async override(@CurrentUser() user: RequestUser, @Body() body: OverrideEnrollmentDto) {
    return this.enrollmentsService.overrideEnrollment(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Xu ly danh sach cho cua mot lop hoc phan' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('sections/:sectionId/process-waitlist')
  async processWaitlist(@CurrentUser() user: RequestUser, @Param('sectionId') sectionId: string) {
    return this.enrollmentsService.processWaitlist(sectionId, buildActor(user))
  }

  @ApiOperation({ summary: 'Chi tiet dang ky hoc phan' })
  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.enrollmentsService.findOne(id, buildActor(user))
  }

  @ApiOperation({ summary: 'Tao dang ky hoc phan, tuong thich endpoint cu' })
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(
      { ...createEnrollmentDto, studentId: this.resolveStudentId(user, createEnrollmentDto.studentId) },
      buildActor(user),
    )
  }

  @ApiOperation({ summary: 'Huy dang ky trong cua so dieu chinh' })
  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: EnrollmentReasonDto,
  ) {
    return this.enrollmentsService.cancelEnrollment(id, buildActor(user), body.reason)
  }

  @ApiOperation({ summary: 'Rut hoc phan truoc han rut' })
  @Post(':id/withdraw')
  async withdraw(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: WithdrawEnrollmentDto,
  ) {
    return this.enrollmentsService.withdrawEnrollment(id, buildActor(user), body.reason)
  }

  @ApiOperation({ summary: 'Cap nhat trang thai dang ky' })
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

  @ApiOperation({ summary: 'Xoa ban ghi dang ky' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.enrollmentsService.remove(id, buildActor(user))
  }
}
