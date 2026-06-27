import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import * as ExcelJS from 'exceljs'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { CreateSectionDto } from './dto/create-section.dto'
import { SectionQueryDto } from './dto/section-query.dto'
import {
  AssignLecturerDto,
  UpdateCapacityDto,
  UpdateRoomScheduleDto,
  UpdateSectionDto,
} from './dto/update-section.dto'
import { SectionsService } from './sections.service'

@ApiTags('sections')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sections')
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @ApiOperation({ summary: 'Danh sách lớp học phần' })
  @Get()
  async findAll(@Query() query: SectionQueryDto) {
    return this.sectionsService.findAll(query)
  }

  @ApiOperation({ summary: 'Danh sách lớp giảng dạy của giảng viên' })
  @UseGuards(RolesGuard)
  @Roles('LECTURER', 'ADMIN', 'ACADEMIC_OFFICE')
  @Get('my-teaching')
  async findMyTeaching(@CurrentUser() user: RequestUser, @Query() query: SectionQueryDto) {
    return this.sectionsService.findAll({ ...query, lecturerId: user.userId })
  }

  @ApiOperation({ summary: 'Danh sách sinh viên trong lớp học phần' })
  @Get(':id/students')
  async findSectionStudents(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sectionsService.findSectionStudents(id, user)
  }

  @ApiOperation({ summary: 'Xuất danh sách sinh viên của lớp ra file Excel' })
  @UseGuards(RolesGuard)
  @Roles('LECTURER', 'ADMIN', 'ACADEMIC_OFFICE')
  @Get(':id/students/export')
  async exportStudents(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const enrollments = await this.sectionsService.findSectionStudents(id, user)
    const section = await this.sectionsService.findOne(id)

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(`Lớp ${section.sectionCode}`)

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'MSSV', key: 'code', width: 15 },
      { header: 'Họ và tên', key: 'fullName', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Trạng thái ĐK', key: 'status', width: 18 },
      { header: 'Ngày đăng ký', key: 'createdAt', width: 20 },
    ]

    // Style header row
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).alignment = { horizontal: 'center' }

    enrollments.forEach((enrollment: any, index: number) => {
      sheet.addRow({
        stt: index + 1,
        code: enrollment.student?.code ?? enrollment.studentId,
        fullName: enrollment.student?.fullName ?? '',
        email: enrollment.student?.email ?? '',
        status: enrollment.status,
        createdAt: enrollment.createdAt
          ? new Date(enrollment.createdAt).toLocaleDateString('vi-VN')
          : '',
      })
    })

    const filename = `danh-sach-lop-${section.sectionCode}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    await workbook.xlsx.write(res)
    res.end()
  }

  @ApiOperation({ summary: 'Chi tiết lớp học phần' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id)
  }

  @ApiOperation({ summary: 'Tạo lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() createSectionDto: CreateSectionDto) {
    return this.sectionsService.create(createSectionDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Cập nhật lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.sectionsService.update(id, updateSectionDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Phân công giảng viên cho lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id/assign-lecturer')
  async assignLecturer(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: AssignLecturerDto,
  ) {
    return this.sectionsService.assignLecturer(id, body, buildActor(user))
  }

  @ApiOperation({ summary: 'Cập nhật phòng và khung giờ lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id/room-schedule')
  async updateRoomSchedule(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateRoomScheduleDto,
  ) {
    return this.sectionsService.updateRoomSchedule(id, body, buildActor(user))
  }

  @ApiOperation({ summary: 'Cập nhật sức chứa lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id/capacity')
  async updateCapacity(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateCapacityDto,
  ) {
    return this.sectionsService.updateCapacity(id, body, buildActor(user))
  }

  @ApiOperation({ summary: 'Hủy lớp học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sectionsService.remove(id, buildActor(user))
  }
}
