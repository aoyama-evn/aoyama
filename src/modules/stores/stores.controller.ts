import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public, Roles } from 'src/common/decorators';
import { AdminRole } from 'src/common/enums';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import {
  CreateHolidayDto,
  CreateStoreDto,
  ReplaceBusinessHoursDto,
  ReplaceTimeSlotsDto,
  UpdateStoreDto,
} from './dto/store.dto';
import { StoresService } from './stores.service';

/** SC-05, SC-06 — danh sach va chi tiet cua hang cho site khach hang. */
@ApiTags('stores')
@Controller('stores')
export class PublicStoresController {
  constructor(private readonly service: StoresService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'SC-05 — danh sach cua hang' })
  list() {
    return this.service.findPublic();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'SC-06 — chi tiet cua hang kem gio lam viec' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}

/** SA-32..SA-35 — quan tri cua hang, gio lam viec, khung gio. */
@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/stores')
export class AdminStoresController {
  constructor(
    private readonly service: StoresService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'SA-32 — danh sach cua hang' })
  list(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-33 — them cua hang' })
  async create(@Body() dto: CreateStoreDto, @CurrentUser() user: AuthUser) {
    const store = await this.service.create(dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE',
      entity: 'Store',
      entityId: store.id,
    });
    return store;
  }

  @Put(':id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-33 — sua cua hang' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: AuthUser,
  ) {
    const store = await this.service.update(id, dto);
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'UPDATE',
      entity: 'Store',
      entityId: id,
      changes: dto as unknown as Record<string, unknown>,
    });
    return store;
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-32 — ngung hoat dong cua hang' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }

  @Put(':id/business-hours')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'SA-34 — dat gio lam viec theo thu' })
  replaceHours(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceBusinessHoursDto) {
    return this.service.replaceBusinessHours(id, dto.hours);
  }

  @Get(':id/holidays')
  @ApiOperation({ summary: 'SA-34 — danh sach ngay nghi' })
  holidays(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.listHolidays(id, from, to);
  }

  @Post(':id/holidays')
  @Roles(AdminRole.ADMIN)
  addHoliday(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateHolidayDto) {
    return this.service.addHoliday(id, dto.date, dto.reason);
  }

  @Delete(':id/holidays/:holidayId')
  @Roles(AdminRole.ADMIN)
  removeHoliday(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('holidayId', ParseUUIDPipe) holidayId: string,
  ) {
    return this.service.removeHoliday(id, holidayId);
  }

  @Get(':id/slots')
  @ApiOperation({ summary: 'SA-35 — khung gio va nang luc tiep nhan' })
  slots(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.listTimeSlots(id);
  }

  @Put(':id/slots')
  @Roles(AdminRole.ADMIN)
  replaceSlots(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplaceTimeSlotsDto) {
    return this.service.replaceTimeSlots(id, dto.slots);
  }
}
