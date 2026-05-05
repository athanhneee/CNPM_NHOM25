import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { CoursesService } from './courses.service'
import { CreateCourseDto } from './dto/create-course.dto'
import { UpdateCourseDto } from './dto/update-course.dto'

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @ApiOperation({ summary: 'Danh sách học phần' })
  @Get()
  async findAll(@Query() query: Record<string, any>) {
    return this.coursesService.findAll(query)
  }

  @ApiOperation({ summary: 'Chi tiết học phần theo id hoặc mã học phần' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id)
  }

  @ApiOperation({ summary: 'Tạo học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Cập nhật học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, updateCourseDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Vô hiệu hóa học phần' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.coursesService.remove(id, buildActor(user))
  }
}
