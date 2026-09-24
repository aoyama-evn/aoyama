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
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthUser, CurrentUser } from 'src/common/decorators';
import { PaginationQueryDto } from 'src/common/dto';
import { Language } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { CustomersService } from './customers.service';

class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() keyword?: string;
  @IsOptional() @IsBoolean() isGuest?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class CreateCustomerDto {
  @IsString() phone!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() nameKana?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsString() internalNote?: string;
}

class UpdateCustomerDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() nameKana?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsEnum(Language) language?: Language;
  @IsOptional() @IsString() internalNote?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() notifySms?: boolean;
  @IsOptional() @IsBoolean() notifyEmail?: boolean;
}

class MergeCustomersDto {
  @IsUUID('4') sourceId!: string;
  @IsUUID('4') targetId!: string;
}

/** SA-15..SA-18 — quan tri khach hang. */
@ApiTags('customers')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/customers')
export class AdminCustomersController {
  constructor(
    private readonly service: CustomersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'SA-15 — danh sach khach hang' })
  list(@Query() query: CustomerQueryDto) {
    return this.service.search(query);
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'SA-18 — goi y ho so nghi trung' })
  duplicates() {
    return this.service.findDuplicateCandidates();
  }

  @Get(':id')
  @ApiOperation({ summary: 'SA-16 — chi tiet khach hang' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'SA-17 — them khach hang' })
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthUser) {
    const created = await this.service.create({ ...dto, isGuest: false });
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE',
      entity: 'Customer',
      entityId: created.id,
    });
    return created;
  }

  @Put(':id')
  @ApiOperation({ summary: 'SA-17 — sua khach hang' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() user: AuthUser,
  ) {
    const updated = await this.service.update(id, dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      changes: dto as unknown as Record<string, unknown>,
    });
    return updated;
  }

  @Post('merge')
  @ApiOperation({ summary: 'SA-18 — gop hai ho so khach hang' })
  async merge(@Body() dto: MergeCustomersDto, @CurrentUser() user: AuthUser) {
    const merged = await this.service.merge(dto.sourceId, dto.targetId);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'MERGE',
      entity: 'Customer',
      entityId: dto.targetId,
      changes: { sourceId: dto.sourceId, targetId: dto.targetId },
    });
    return merged;
  }
}
