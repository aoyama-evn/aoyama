import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AuthUser, CurrentUser, Roles } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import {
  AdminRole,
  NotificationChannel,
  NotificationEvent,
  NotificationSendStatus,
} from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AdminNotificationsService } from './admin-notifications.service';
import { NotificationsService } from './notifications.service';

class FeedQueryDto {
  @IsOptional() @IsString() storeId?: string;
}

class UpdateTemplateDto {
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class LogQueryDto extends PaginationQueryDto {
  @IsOptional() @IsEnum(NotificationEvent) event?: NotificationEvent;
  @IsOptional() @IsEnum(NotificationChannel) channel?: NotificationChannel;
  @IsOptional() @IsEnum(NotificationSendStatus) status?: NotificationSendStatus;
  @IsOptional() @IsString() recipient?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

/** SA-41 Mau thong bao, SA-42 Nhat ky gui thong bao. */
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/notifications')
export class NotificationsController {
  constructor(
    private readonly service: NotificationsService,
    private readonly adminFeed: AdminNotificationsService,
  ) {}

  @Get('templates')
  @ApiOperation({ summary: 'SA-41 — danh sach mau thong bao' })
  listTemplates() {
    return this.service.listTemplates();
  }

  @Put('templates/:id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-41 — cap nhat mau thong bao' })
  updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateTemplate(id, dto, user.sub);
  }

  @Get('logs')
  @ApiOperation({ summary: 'SA-42 — tra cuu nhat ky gui thong bao' })
  logs(@Query() query: LogQueryDto) {
    return this.service.searchLogs(query);
  }

  /**
   * CP-05 — chuong tren thanh tieu de.
   *
   * Truoc day con so nay la "so tin nhan gui that bai", tuc mot canh bao ky
   * thuat. Gio no la so viec nhan vien chua xem: lich hen moi dat, khach vua
   * chot bao gia. Tin gui loi van xem o trang nhat ky.
   */
  @Get('unread-count')
  @ApiOperation({ summary: 'CP-05 — so thong bao nhan vien chua doc' })
  unreadCount(@CurrentUser() user: AuthUser, @Query() query: FeedQueryDto) {
    return this.adminFeed.unreadCount(user.sub, query.storeId);
  }

  @Get('feed')
  @ApiOperation({ summary: 'CP-05 — danh sach thong bao trong trang quan tri' })
  feed(@CurrentUser() user: AuthUser, @Query() query: FeedQueryDto) {
    return this.adminFeed.list(user.sub, query.storeId);
  }

  @Put('feed/:id/read')
  @ApiOperation({ summary: 'Danh dau mot thong bao la da doc' })
  async markRead(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    await this.adminFeed.markRead(id, user.sub);
    return { ok: true };
  }

  @Put('feed/read-all')
  @ApiOperation({ summary: 'Danh dau tat ca la da doc' })
  async markAllRead(@CurrentUser() user: AuthUser, @Query() query: FeedQueryDto) {
    await this.adminFeed.markAllRead(user.sub, query.storeId);
    return { ok: true };
  }

  @Get('failed-count')
  @ApiOperation({ summary: 'SA-42 — so tin nhan gui that bai con phai xu ly' })
  failedCount() {
    return this.service.countFailedLogs();
  }

  @Post('logs/:id/retry')
  @ApiOperation({ summary: 'SA-42 — gui lai thong bao that bai' })
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.retry(id);
  }
}
