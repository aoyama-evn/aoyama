import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AuthUser, CurrentUser, Roles } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { AdminRole } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from './audit.service';
import { SettingsService } from './settings.service';

class SettingEntryDto {
  @IsString()
  key!: string;

  value!: unknown;
}

class UpdateSettingsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SettingEntryDto)
  entries!: SettingEntryDto[];
}

class AuditQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() actorId?: string;
  @IsOptional() @IsString() entity?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() from?: string;
  @IsOptional() @IsString() to?: string;
}

/** SA-43 Cau hinh he thong, SA-44 Nhat ky thao tac. */
@ApiTags('system')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/system')
export class SystemController {
  constructor(
    private readonly settings: SettingsService,
    private readonly audit: AuditService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'SA-43 — doc tham so he thong' })
  async getSettings(@Query('group') group?: string) {
    return this.settings.findAll(group);
  }

  @Put('settings')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-43 — cap nhat tham so he thong' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @CurrentUser() user: AuthUser) {
    await this.settings.upsertMany(dto.entries, user.sub);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'UPDATE_SETTINGS',
      entity: 'SystemSetting',
      changes: { keys: dto.entries.map((e) => e.key) },
    });
    return this.settings.findAll();
  }

  @Get('audit-logs')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-44 — tra cuu nhat ky thao tac' })
  async auditLogs(@Query() query: AuditQueryDto) {
    return this.audit.search(query);
  }
}
