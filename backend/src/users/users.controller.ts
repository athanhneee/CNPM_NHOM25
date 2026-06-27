import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AccountStatus } from '@prisma/client'
import { CurrentUser } from '../common/decorators/user.decorator'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { buildActor } from '../common/utils/audit'
import { CreateUserDto } from './dto/create-user.dto'
import { ImportStudentCandidateDto, ImportStudentsDto } from './dto/import-students.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UserQueryDto } from './dto/user-query.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Danh sách tài khoản người dùng' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get()
  async findAll(@Query() query: UserQueryDto) {
    return this.usersService.findAll(query)
  }

  @ApiOperation({ summary: 'Hồ sơ người dùng hiện tại' })
  @Get('me')
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.findOne(userId)
  }

  @ApiOperation({ summary: 'Cập nhật hồ sơ người dùng hiện tại' })
  @Patch('me')
  async updateProfile(@CurrentUser() user: RequestUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(user.userId, updateUserDto, buildActor(user), false)
  }

  @ApiOperation({ summary: 'Kết quả học tập của người dùng hiện tại' })
  @Get('me/academic-records')
  async getMyAcademicRecords(@CurrentUser('userId') userId: string) {
    return this.usersService.getAcademicRecords(userId)
  }

  @ApiOperation({ summary: 'Kết quả học tập của tài khoản (dành cho Admin)' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Get(':id/academic-records')
  async getAcademicRecords(@Param('id') id: string) {
    return this.usersService.getAcademicRecords(id)
  }

  @ApiOperation({ summary: 'Tạo nhiều tài khoản sinh viên từ danh sách import' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('import-students')
  async importStudents(@CurrentUser() user: RequestUser, @Body() body: ImportStudentsDto) {
    return this.usersService.importStudentUsers(body.students, buildActor(user))
  }

  @ApiOperation({ summary: 'Tạo một tài khoản sinh viên từ MSSV và họ tên' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post('students')
  async createStudent(@CurrentUser() user: RequestUser, @Body() body: ImportStudentCandidateDto) {
    return this.usersService.createStudentUser(body, buildActor(user))
  }

  @ApiOperation({ summary: 'Chi tiết tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }

  @ApiOperation({ summary: 'Tạo tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Cập nhật tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto, buildActor(user))
  }

  @ApiOperation({ summary: 'Khóa tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/lock')
  async lock(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.setStatus(id, AccountStatus.LOCKED, buildActor(user))
  }

  @ApiOperation({ summary: 'Mở khóa tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/unlock')
  async unlock(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.setStatus(id, AccountStatus.ACTIVE, buildActor(user))
  }

  @ApiOperation({ summary: 'Đặt lại mật khẩu tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/reset-password')
  async resetPassword(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, body.password, buildActor(user))
  }

  @ApiOperation({ summary: 'Vô hiệu hóa tài khoản' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.usersService.remove(id, buildActor(user))
  }
}
