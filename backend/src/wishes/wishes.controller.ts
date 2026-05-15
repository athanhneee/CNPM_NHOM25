import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser } from '../common/decorators/user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { RequestUser } from '../common/types/request-user'
import { CreateWishDto } from './dto/create-wish.dto'
import { UpdateWishStatusDto } from './dto/update-wish.dto'
import { WishQueryDto } from './dto/wish-query.dto'
import { WishesService } from './wishes.service'

@ApiTags('wishes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishes')
export class WishesController {
  constructor(private wishesService: WishesService) {}

  @ApiOperation({ summary: 'Danh sách nguyện vọng học phần' })
  @Get()
  async findAll(@CurrentUser() user: RequestUser, @Query() query: WishQueryDto) {
    return this.wishesService.findAll(user, query)
  }

  @ApiOperation({ summary: 'Chi tiết nguyện vọng học phần' })
  @Get(':id')
  async findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.wishesService.findOne(id, user)
  }

  @ApiOperation({ summary: 'Sinh viên gửi nguyện vọng học phần' })
  @Post()
  async create(@CurrentUser() user: RequestUser, @Body() body: CreateWishDto) {
    return this.wishesService.create(user, body)
  }

  @ApiOperation({ summary: 'Sinh viên hủy nguyện vọng đang chờ xử lý' })
  @Post(':id/cancel')
  async cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.wishesService.cancel(id, user)
  }

  @ApiOperation({ summary: 'Phòng đào tạo/quản trị cập nhật trạng thái nguyện vọng' })
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'ACADEMIC_OFFICE')
  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: UpdateWishStatusDto,
  ) {
    return this.wishesService.updateStatus(id, body.status, user, body.reviewNote)
  }
}
