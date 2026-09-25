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
import { NotificationsService } from './notifications.service';

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
  constructor(private readonly service: NotificationsService) {}

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

  @Get('unread-count')
  @ApiOperation({ summary: 'CP-05 — so thong bao gui loi con phai xu ly' })
  unreadCount() {
    return this.service.countFailedLogs();
  }

  @Post('logs/:id/retry')
  @ApiOperation({ summary: 'SA-42 — gui lai thong bao that bai' })
  retry(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.retry(id);
  }
}
