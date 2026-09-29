import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public } from 'src/common/decorators';
import { AdminGuard, RolesGuard } from 'src/common/guards';
import { AuditService } from 'src/modules/system/audit.service';
import { AvailabilityService } from './availability.service';
import { BookingsService } from './bookings.service';
import {
  AdminCreateBookingDto,
  AvailabilityQueryDto,
  BookingQueryDto,
  CalendarQueryDto,
  CancelBookingDto,
  CreateBookingDto,
  LookupBookingDto,
  LookupQrDto,
  RescheduleBookingDto,
} from './dto/booking.dto';
import { QrService } from './qr.service';

/** SC-12..SC-16, SC-20, SC-22..SC-24 — luong dat lich phia khach hang. */
@ApiTags('bookings')
@Controller('bookings')
export class PublicBookingsController {
  constructor(
    private readonly service: BookingsService,
    private readonly availability: AvailabilityService,
    private readonly qr: QrService,
  ) {}

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'SC-13 — khung gio con cho theo ngay' })
  getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.availability.getRange(query.storeId, query.from, query.days ?? 14);
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'SC-15 — tao lich hen (Guest hoac khach da dang nhap)' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user?: AuthUser) {
    return this.service.create(dto, {
      type: user ? 'CUSTOMER' : 'CUSTOMER',
      id: user?.sub ?? null,
      name: user?.name ?? dto.contactName,
    });
  }

  @Public()
  @Post('lookup')
  @ApiOperation({ summary: 'SC-20 — Guest tra cuu lich hen bang ma va so dien thoai' })
  lookup(@Body() dto: LookupBookingDto) {
    return this.service.lookupForGuest(dto.code, dto.phone);
  }

  @Public()
  @Post('lookup-qr')
  @HttpCode(200)
  @ApiOperation({ summary: 'SC-20 — tim lich hen tu anh ma QR khach tai len' })
  async lookupByQr(@Body() dto: LookupQrDto) {
    const booking = await this.qr.findByToken(dto.token.trim());
    // Chi tra ma lich hen; man theo doi tien do se tu lay phan con lai.
    return { code: booking.code };
  }

  @Public()
  @Get(':code')
  @ApiOperation({ summary: 'SC-22 — chi tiet lich hen theo ma' })
  detail(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  @Public()
  @Get(':code/qr')
  @ApiOperation({ summary: 'SC-22 — anh ma QR cua lich hen da xac nhan' })
  async qrImage(@Param('code') code: string) {
    const booking = await this.service.findByCode(code);
    if (!booking.qrToken) {
      return { available: false, message: 'Lich hen nay chua co ma QR' };
    }
    return {
      available: true,
      token: booking.qrToken,
      dataUrl: await this.qr.renderDataUrl(booking.qrToken),
    };
  }

  @ApiBearerAuth()
  @Put(':id/cancel')
  @ApiOperation({ summary: 'SC-24 — khach huy lich hen (BR-04)' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.assertOwnedByCustomer(id, user.sub);
    return this.service.cancel(id, { type: 'CUSTOMER', id: user.sub, name: user.name }, dto.reason);
  }

  @ApiBearerAuth()
  @Put(':id/reschedule')
  @ApiOperation({ summary: 'SC-23 — khach doi lich hen (BR-05)' })
  async reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    await this.service.assertOwnedByCustomer(id, user.sub);
    return this.service.reschedule(id, dto, { type: 'CUSTOMER', id: user.sub, name: user.name });
  }
}

/** SC-21 — lich hen cua khach dang dang nhap. */
@ApiTags('bookings')
@ApiBearerAuth()
@Controller('account/bookings')
export class MyBookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'SC-21 — lich hen cua toi' })
  list(@CurrentUser() user: AuthUser, @Query() query: BookingQueryDto) {
    return this.service.findByCustomer(user.sub, query);
  }
}

/** SA-03..SA-06 — quan tri lich hen. */
@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(AdminGuard, RolesGuard)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(
    private readonly service: BookingsService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'SA-03 — danh sach lich hen' })
  list(@Query() query: BookingQueryDto) {
    return this.service.search(query);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'SA-04 — lich hen dang lich theo ngay hoac tuan' })
  calendar(@Query() query: CalendarQueryDto) {
    return this.service.findForCalendar(query.storeId, query.from, query.days ?? 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'SA-05 — chi tiet lich hen' })
  detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'SA-06 — dat lich thay khach (BR-12)' })
  async create(@Body() dto: AdminCreateBookingDto, @CurrentUser() user: AuthUser) {
    const booking = await this.service.createByAdmin(dto, {
      type: 'ADMIN',
      id: user.sub,
      name: user.name,
    });
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CREATE_ON_BEHALF',
      entity: 'Booking',
      entityId: booking.id,
    });
    return booking;
  }

  @Put(':id/confirm')
  @ApiOperation({ summary: 'SA-05 — xac nhan lich hen, sinh ma QR va gui SMS' })
  async confirm(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    const booking = await this.service.confirm(id, {
      type: 'ADMIN',
      id: user.sub,
      name: user.name,
    });
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CONFIRM',
      entity: 'Booking',
      entityId: id,
    });
    return booking;
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'SA-05 — huy lich hen' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    const booking = await this.service.cancel(
      id,
      { type: 'ADMIN', id: user.sub, name: user.name },
      dto.reason,
    );
    await this.audit.record({
      actorId: user.sub,
      actorName: user.name,
      actorType: 'ADMIN',
      action: 'CANCEL',
      entity: 'Booking',
      entityId: id,
      changes: { reason: dto.reason },
    });
    return booking;
  }

  @Put(':id/reschedule')
  @ApiOperation({ summary: 'SA-05 — doi lich hen' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.reschedule(id, dto, { type: 'ADMIN', id: user.sub, name: user.name });
  }

  @Put(':id/no-show')
  @ApiOperation({ summary: 'SA-05 — danh dau khach khong den' })
  noShow(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.service.markNoShow(id, { type: 'ADMIN', id: user.sub, name: user.name });
  }

  @Put(':id/note')
  @ApiOperation({ summary: 'SA-05 — ghi chu noi bo' })
  note(@Param('id', ParseUUIDPipe) id: string, @Body('note') note: string) {
    return this.service.updateAdminNote(id, note);
  }
}
