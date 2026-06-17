import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
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

  @ApiOperation({ summary: 'Danh sách sinh viên trong lớp học phần' })
  @Get(':id/students')
  async findSectionStudents(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sectionsService.findSectionStudents(id, user)
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
