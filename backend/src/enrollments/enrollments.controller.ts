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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Multer } from 'multer'
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
  TransferEnrollmentDto,
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
      body.force
    )
  }

  @ApiOperation({ summary: 'Academic/Admin override dang ky hoc phan' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('override')
  async override(@CurrentUser() user: RequestUser, @Body() body: OverrideEnrollmentDto) {
    return this.enrollmentsService.overrideEnrollment(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Chuyển sinh viên sang lớp khác (Atomic Transfer)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post('transfer')
  async transfer(@CurrentUser() user: RequestUser, @Body() body: TransferEnrollmentDto) {
    return this.enrollmentsService.transferEnrollment(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Nhập đăng ký hàng loạt từ file CSV' })
  @ApiConsumes('multipart/form-data')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @UseInterceptors(FileInterceptor('file'))
  @Post('bulk-import')
  async bulkImport(@CurrentUser() user: RequestUser, @UploadedFile() file: { buffer: Buffer; originalname: string }) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file CSV.')
    }

    const content = file.buffer.toString('utf-8')
    const lines = content.split(/\r?\n/).filter((line: string) => line.trim())

    if (lines.length < 2) {
      throw new BadRequestException('File CSV phải có ít nhất 1 dòng header và 1 dòng dữ liệu.')
    }

    // Parse CSV: expected header "studentId,sectionId"
    const rows: Array<{ studentId: string; sectionId: string }> = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c: string) => c.trim())
      if (cols.length < 2 || !cols[0] || !cols[1]) continue
      rows.push({ studentId: cols[0], sectionId: cols[1] })
    }

    if (rows.length === 0) {
      throw new BadRequestException('Không tìm thấy dữ liệu hợp lệ trong file CSV.')
    }

    return this.enrollmentsService.bulkRegister(rows, buildActor(user))
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
    return this.enrollmentsService.cancelEnrollment(id, buildActor(user), body.reason, body.force)
  }

  @ApiOperation({ summary: 'Rut hoc phan truoc han rut' })
  @Post(':id/withdraw')
  async withdraw(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: WithdrawEnrollmentDto,
  ) {
    return this.enrollmentsService.withdrawEnrollment(id, buildActor(user), body.reason, body.force)
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
