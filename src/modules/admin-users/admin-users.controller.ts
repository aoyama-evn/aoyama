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
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { AuthUser, CurrentUser, Roles } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { AdminRole, Language } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { AdminUsersService } from './admin-users.service';

class UserQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
  @IsOptional() @IsUUID('4') storeId?: string;
}

class CreateAdminUserDto {
  @IsString() @IsNotEmpty() username!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() fullName!: string;

  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
}

class UpdateAdminUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEnum(AdminRole) role?: AdminRole;
  @IsOptional() @IsUUID('4') storeId?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsString() @MinLength(8) password?: string;
}

class SetActiveDto {
  @IsBoolean() isActive!: boolean;
}

class ResetPasswordDto {
  @IsString() @MinLength(8) newPassword!: string;
}

/** SA-39, SA-40 — tai khoan quan tri. Chi vai tro ADMIN duoc thao tac. */
@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Roles(AdminRole.ADMIN)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly service: AdminUsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'SA-39 — danh sach tai khoan quan tri' })
  list(@Query() query: UserQueryDto) {
    return this.service.search(query);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'SA-40 — them tai khoan quan tri' })
  async create(@Body() dto: CreateAdminUserDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create(dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE',
      entity: 'AdminUser',
      entityId: created.id,
      changes: { username: dto.username, role: dto.role },
    });
    return created;
  }

  @Put(':id')
  @ApiOperation({ summary: 'SA-40 — sua tai khoan quan tri' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.service.update(id, dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'UPDATE',
      entity: 'AdminUser',
      entityId: id,
      changes: { ...dto, password: dto.password ? '***' : undefined },
    });
    return updated;
  }

  @Put(':id/active')
  @ApiOperation({ summary: 'SA-39 — khoa hoac mo tai khoan (FR-USR-05)' })
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetActiveDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.service.setActive(id, dto.isActive);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: dto.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'AdminUser',
      entityId: id,
    });
    return updated;
  }

  @Put(':id/unlock')
  @ApiOperation({ summary: 'SA-39 — go khoa tai khoan bi khoa do dang nhap sai' })
  unlock(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.unlock(id);
  }

  @Put(':id/reset-password')
  @ApiOperation({ summary: 'SA-40 — dat lai mat khau' })
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.resetPassword(id, dto.newPassword);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'RESET_PASSWORD',
      entity: 'AdminUser',
      entityId: id,
    });
    return { success: true };
  }
}
