import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { PageDto } from 'src/common/dto';
import {
  BOOKING_TRANSITIONS,
  BookingServiceType,
  BookingStatus,
  DEFAULT_LANGUAGE,
  NotificationChannel,
  NotificationEvent,
} from 'src/common/enums';
import {
  formatAppDateTime,
  generateBookingCode,
  hoursBetween,
  normalizePhone,
  zonedDateTimeToUtc,
} from 'src/common/utils';
import { pickI18n } from 'src/common/types';
import { CatalogService } from 'src/modules/catalog/catalog.service';
import { CustomersService } from 'src/modules/customers/customers.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { StoresService } from 'src/modules/stores/stores.service';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { VehiclesService } from 'src/modules/vehicles/vehicles.service';
import { AvailabilityService } from './availability.service';
import {
  AdminCreateBookingDto,
  BookingQueryDto,
  CreateBookingDto,
  RescheduleBookingDto,
} from './dto/booking.dto';
import { Booking } from './entities/booking.entity';
import { BookingService as BookingServiceLine } from './entities/booking-service.entity';
import { BookingStatusHistory } from './entities/booking-status-history.entity';
import { QrService } from './qr.service';

export interface Actor {
  type: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  id?: string | null;
  name?: string | null;
}

/** M-04 — Dat lich. SC-12..SC-16, SC-20..SC-25, SA-03..SA-06. */
@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking) private readonly repo: Repository<Booking>,
    @InjectRepository(BookingStatusHistory)
    private readonly historyRepo: Repository<BookingStatusHistory>,
    private readonly dataSource: DataSource,
    private readonly availability: AvailabilityService,
    private readonly customers: CustomersService,
    private readonly vehicles: VehiclesService,
    private readonly stores: StoresService,
    private readonly catalog: CatalogService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
    private readonly qr: QrService,
  ) {}

  // ---------------- Tao lich hen ----------------

  /**
   * SC-15 — tao lich hen. Guest chi can ten va so dien thoai (FR-BOOK-01).
   * Toan bo buoc ghi nam trong mot giao dich de khong sinh lich hen mo coi khi
   * mot buoc phu that bai.
   */
  async create(
    dto: CreateBookingDto,
    actor: Actor,
    adminExtras?: Partial<Booking>,
  ): Promise<Booking> {
    const phone = normalizePhone(dto.contactPhone);
    const scheduledAt = zonedDateTimeToUtc(dto.date, dto.startTime);

    await this.assertNotDuplicated(phone, scheduledAt);
    await this.availability.assertSlotAvailable(dto.storeId, dto.date, dto.startTime);

    const store = await this.stores.findOne(dto.storeId);
    const slot = (await this.stores.getSlotsForWeekday(dto.storeId, weekdayOf(dto.date))).find(
      (s) => s.startTime.slice(0, 5) === dto.startTime,
    );
    if (!slot) {
      throw new BadRequestException({ code: 'SLOT_NOT_FOUND', message: 'Khung gio khong ton tai' });
    }

    const customer = adminExtras?.customerId
      ? await this.customers.findById(adminExtras.customerId)
      : await this.customers.findOrCreateByPhone({
          phone,
          name: dto.contactName,
          email: dto.contactEmail ?? null,
        });

    const vehicleId = await this.resolveVehicle(dto, customer.id);
    const serviceLines = await this.buildServiceLines(dto.serviceIds, dto.storeId, vehicleId);

    const booking = await this.dataSource.transaction(async (manager) => {
      const entity = manager.getRepository(Booking).create({
        code: generateBookingCode(),
        customerId: customer.id,
        vehicleId,
        storeId: dto.storeId,
        status: BookingStatus.PENDING,
        serviceType: dto.serviceType,
        scheduledAt,
        slotStartTime: slot.startTime,
        slotEndTime: slot.endTime,
        contactName: dto.contactName.trim(),
        contactPhone: phone,
        contactEmail: dto.contactEmail ?? null,
        symptomDescription: dto.symptomDescription ?? null,
        symptomPhotoUrls: dto.symptomPhotoUrls ?? [],
        aiDiagnosisId: dto.aiDiagnosisId ?? null,
        createdByAdmin: actor.type === 'ADMIN',
        createdByAdminId: actor.type === 'ADMIN' ? (actor.id ?? null) : null,
        adminNote: adminExtras?.adminNote ?? null,
        rebookedFromId: adminExtras?.rebookedFromId ?? null,
      });
      const saved = await manager.getRepository(Booking).save(entity);

      await manager
        .getRepository(BookingServiceLine)
        .save(
          serviceLines.map((line) =>
            manager.getRepository(BookingServiceLine).create({ ...line, bookingId: saved.id }),
          ),
        );

      await manager.getRepository(BookingStatusHistory).save(
        manager.getRepository(BookingStatusHistory).create({
          bookingId: saved.id,
          fromStatus: null,
          toStatus: BookingStatus.PENDING,
          action: 'CREATE',
          actorType: actor.type,
          actorId: actor.id ?? null,
        }),
      );

      return saved;
    });

    // FR-BOOK-10 — SMS xac nhan da nhan yeu cau, kem ma lich hen.
    await this.notify(booking, NotificationEvent.BOOKING_CREATED, {
      storeName: pickI18n(store.name, customer.language),
    });

    return this.findById(booking.id);
  }

  /** SA-06 — Admin dat thay khach; lich do Admin tao duoc xac nhan luon (BR-12). */
  async createByAdmin(dto: AdminCreateBookingDto, actor: Actor): Promise<Booking> {
    const booking = await this.create(dto, actor, {
      customerId: dto.customerId,
      adminNote: dto.adminNote ?? null,
    });
    return this.confirm(booking.id, actor);
  }

  // ---------------- Doc ----------------

  async findById(id: string): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { id },
      relations: {
        customer: true,
        vehicle: true,
        store: true,
        services: true,
        statusHistories: true,
      },
      order: { statusHistories: { createdAt: 'ASC' } },
    });
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Khong tim thay lich hen',
      });
    }
    return booking;
  }

  async findByCode(code: string): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { code: code.trim().toUpperCase() },
      relations: { customer: true, vehicle: true, store: true, services: true },
    });
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Khong tim thay lich hen',
      });
    }
    return booking;
  }

  /**
   * SC-20 — Guest tra cuu bang ma lich hen kem so dien thoai.
   * Doi hoi ca hai de mot nguoi biet ma van khong xem duoc lich cua nguoi khac.
   */
  async lookupForGuest(code: string, rawPhone: string): Promise<Booking> {
    const booking = await this.findByCode(code);
    if (booking.contactPhone !== normalizePhone(rawPhone)) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Khong tim thay lich hen khop voi ma va so dien thoai',
      });
    }
    return booking;
  }

  /** SC-21 — lich hen cua khach dang dang nhap. */
  async findByCustomer(customerId: string, query: BookingQueryDto): Promise<PageDto<Booking>> {
    const qb = this.baseQuery().where('b.customer_id = :customerId', { customerId });
    this.applyFilters(qb, query);
    const [items, total] = await qb
      .orderBy('b.scheduledAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  /** SA-03 — danh sach lich hen phia quan tri. */
  async search(query: BookingQueryDto): Promise<PageDto<Booking>> {
    const qb = this.baseQuery();
    this.applyFilters(qb, query);
    if (query.keyword) {
      qb.andWhere(
        '(b.code ILIKE :kw OR b.contact_name ILIKE :kw OR b.contact_phone ILIKE :kw OR v.plate_number ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('b.scheduledAt', query.sortOrder)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  /** SA-04 — lich hen dang lich theo ngay hoac tuan. */
  async findForCalendar(storeId: string, from: string, days: number): Promise<Booking[]> {
    const start = zonedDateTimeToUtc(from, '00:00');
    const end = new Date(start.getTime() + days * 86_400_000);
    return this.baseQuery()
      .where('b.store_id = :storeId', { storeId })
      .andWhere('b.scheduled_at >= :start', { start })
      .andWhere('b.scheduled_at < :end', { end })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .orderBy('b.scheduledAt', 'ASC')
      .getMany();
  }

  // ---------------- Chuyen trang thai ----------------

  /** SA-05 — Admin xac nhan lich hen, sinh QR va gui SMS (Luong B). */
  async confirm(id: string, actor: Actor): Promise<Booking> {
    const booking = await this.assertTransition(id, BookingStatus.CONFIRMED);

    booking.status = BookingStatus.CONFIRMED;
    booking.confirmedAt = new Date();
    await this.repo.save(booking);
    await this.qr.issueToken(booking);
    await this.recordHistory(booking, BookingStatus.PENDING, BookingStatus.CONFIRMED, actor);

    const store = await this.stores.findOne(booking.storeId);
    await this.notify(booking, NotificationEvent.BOOKING_CONFIRMED, {
      storeName: pickI18n(store.name, booking.customer?.language ?? undefined),
      storePhone: store.phone,
    });

    return this.findById(id);
  }

  /**
   * SC-24, SA-05 — huy lich hen.
   * BR-04: khach chi huy duoc truoc gio hen mot khoang toi thieu; Admin khong bi chan.
   */
  async cancel(id: string, actor: Actor, reason?: string): Promise<Booking> {
    const booking = await this.assertTransition(id, BookingStatus.CANCELLED);

    if (actor.type === 'CUSTOMER') {
      const cutoff = this.settings.getNumber(
        SETTING_KEYS.BOOKING_CANCEL_CUTOFF_HOURS,
        'booking.cancelCutoffHours',
        2,
      );
      const hoursLeft = hoursBetween(new Date(), booking.scheduledAt);
      if (hoursLeft < cutoff) {
        throw new BadRequestException({
          code: 'CANCEL_TOO_LATE',
          message: `Chi huy duoc truoc gio hen it nhat ${cutoff} tieng. Vui long goi cua hang.`,
          details: { cutoffHours: cutoff },
        });
      }
    }

    const from = booking.status;
    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = reason ?? null;
    booking.cancelledBy = actor.type;
    await this.repo.save(booking);
    await this.recordHistory(booking, from, BookingStatus.CANCELLED, actor, reason);

    await this.notify(booking, NotificationEvent.BOOKING_CANCELLED, {});
    return this.findById(id);
  }

  /**
   * SC-23, SA-05 — doi lich.
   * Doi lich khong doi trang thai (RD muc 5.1) nhung van ghi mot dong nhat ky.
   */
  async reschedule(id: string, dto: RescheduleBookingDto, actor: Actor): Promise<Booking> {
    const booking = await this.findById(id);

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestException({
        code: 'RESCHEDULE_NOT_ALLOWED',
        message: 'Chi doi duoc lich hen dang cho xac nhan hoac da xac nhan',
      });
    }

    if (actor.type === 'CUSTOMER') {
      const cutoff = this.settings.getNumber(
        SETTING_KEYS.BOOKING_RESCHEDULE_CUTOFF_HOURS,
        'booking.rescheduleCutoffHours',
        2,
      );
      if (hoursBetween(new Date(), booking.scheduledAt) < cutoff) {
        throw new BadRequestException({
          code: 'RESCHEDULE_TOO_LATE',
          message: `Chi doi duoc lich truoc gio hen it nhat ${cutoff} tieng. Vui long goi cua hang.`,
          details: { cutoffHours: cutoff },
        });
      }
    }

    const storeId = dto.storeId ?? booking.storeId;
    await this.availability.assertSlotAvailable(storeId, dto.date, dto.startTime, booking.id);

    const slot = (await this.stores.getSlotsForWeekday(storeId, weekdayOf(dto.date))).find(
      (s) => s.startTime.slice(0, 5) === dto.startTime,
    );
    if (!slot) {
      throw new BadRequestException({ code: 'SLOT_NOT_FOUND', message: 'Khung gio khong ton tai' });
    }

    const previousScheduledAt = booking.scheduledAt;
    booking.storeId = storeId;
    booking.scheduledAt = zonedDateTimeToUtc(dto.date, dto.startTime);
    booking.slotStartTime = slot.startTime;
    booking.slotEndTime = slot.endTime;
    // Doi lich thi nhac lich cu khong con dung nua.
    booking.reminderSentAt = null;
    await this.repo.save(booking);

    await this.historyRepo.save(
      this.historyRepo.create({
        bookingId: booking.id,
        fromStatus: booking.status,
        toStatus: booking.status,
        action: 'RESCHEDULE',
        actorType: actor.type,
        actorId: actor.id ?? null,
        note: dto.reason ?? null,
        previousScheduledAt,
      }),
    );

    const store = await this.stores.findOne(storeId);
    await this.notify(booking, NotificationEvent.BOOKING_RESCHEDULED, {
      storeName: pickI18n(store.name, booking.customer?.language ?? undefined),
    });

    return this.findById(id);
  }

  /** Chuyen sang RECEIVED — goi tu buoc tiep nhan xe (SA-08). */
  async markReceived(id: string, actor: Actor): Promise<Booking> {
    const booking = await this.assertTransition(id, BookingStatus.RECEIVED);
    booking.status = BookingStatus.RECEIVED;
    booking.receivedAt = new Date();
    await this.repo.save(booking);
    await this.recordHistory(booking, BookingStatus.CONFIRMED, BookingStatus.RECEIVED, actor);
    return booking;
  }

  /** Chuyen sang DONE — goi khi phieu dich vu duoc ban giao. */
  async markDone(id: string, actor: Actor): Promise<Booking> {
    const booking = await this.assertTransition(id, BookingStatus.DONE);
    booking.status = BookingStatus.DONE;
    booking.completedAt = new Date();
    await this.repo.save(booking);
    await this.recordHistory(booking, BookingStatus.RECEIVED, BookingStatus.DONE, actor);
    return booking;
  }

  /** Danh dau khach khong den — tien trinh nen goi, hoac Admin bam tay o SA-05. */
  async markNoShow(id: string, actor: Actor): Promise<Booking> {
    const booking = await this.assertTransition(id, BookingStatus.NO_SHOW);
    booking.status = BookingStatus.NO_SHOW;
    await this.repo.save(booking);
    await this.recordHistory(booking, BookingStatus.CONFIRMED, BookingStatus.NO_SHOW, actor);
    return booking;
  }

  async updateAdminNote(id: string, note: string): Promise<Booking> {
    await this.repo.update(id, { adminNote: note });
    return this.findById(id);
  }

  async markReminderSent(id: string): Promise<void> {
    await this.repo.update(id, { reminderSentAt: new Date() });
  }

  /** Chan khach doc hoac sua lich hen cua nguoi khac — NFR-SE-07. */
  async assertOwnedByCustomer(bookingId: string, customerId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);
    if (booking.customerId !== customerId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Lich hen khong thuoc ve tai khoan nay',
      });
    }
    return booking;
  }

  // ---------------- Ho tro ----------------

  private baseQuery() {
    return this.repo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.customer', 'c')
      .leftJoinAndSelect('b.vehicle', 'v')
      .leftJoinAndSelect('b.store', 's')
      .leftJoinAndSelect('b.services', 'bs');
  }

  private applyFilters(qb: ReturnType<BookingsService['baseQuery']>, query: BookingQueryDto): void {
    if (query.storeId) qb.andWhere('b.store_id = :storeId', { storeId: query.storeId });
    if (query.status) qb.andWhere('b.status = :status', { status: query.status });
    if (query.serviceType) {
      qb.andWhere('b.service_type = :serviceType', { serviceType: query.serviceType });
    }
    if (query.from) {
      qb.andWhere('b.scheduled_at >= :from', { from: zonedDateTimeToUtc(query.from, '00:00') });
    }
    if (query.to) {
      qb.andWhere('b.scheduled_at < :to', {
        to: new Date(zonedDateTimeToUtc(query.to, '00:00').getTime() + 86_400_000),
      });
    }
  }

  /** BR-10 — mot so dien thoai khong dat hai lich trung khung gio. */
  private async assertNotDuplicated(phone: string, scheduledAt: Date): Promise<void> {
    const existing = await this.repo.count({
      where: {
        contactPhone: phone,
        scheduledAt,
        status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
      },
    });
    if (existing > 0) {
      throw new BadRequestException({
        code: 'BOOKING_DUPLICATE',
        message: 'So dien thoai nay da co lich hen vao dung khung gio do',
      });
    }
  }

  /** Dung xe da chon, hoac tao xe moi tu thong tin khach vua khai bao. */
  private async resolveVehicle(dto: CreateBookingDto, customerId: string): Promise<string | null> {
    const input = dto.vehicle;
    if (!input) return null;

    if (input.vehicleId) {
      const vehicle = await this.vehicles.findById(input.vehicleId);
      if (vehicle.customerId !== customerId) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'Xe khong thuoc ve khach hang nay',
        });
      }
      return vehicle.id;
    }

    if (!input.plateNumber) return null;

    const existing = await this.vehicles.findByPlate(input.plateNumber);
    if (existing) return existing.id;

    const created = await this.vehicles.create({
      customerId,
      plateNumber: input.plateNumber,
      maker: input.maker ?? 'Chua ro',
      model: input.model ?? 'Chua ro',
      engineCc: input.engineCc ?? null,
      currentOdometer: input.odometer ?? null,
    });
    return created.id;
  }

  /** Chup lai ten va gia dich vu tai thoi diem dat — BR-37. */
  private async buildServiceLines(
    serviceIds: string[],
    storeId: string,
    vehicleId: string | null,
  ): Promise<Partial<BookingServiceLine>[]> {
    const engineCc = vehicleId ? (await this.vehicles.findById(vehicleId)).engineCc : null;

    return Promise.all(
      serviceIds.map(async (serviceId) => {
        const service = await this.catalog.findOne(serviceId);
        const { price } = await this.catalog.resolvePrice({ serviceId, storeId, engineCc });
        return {
          serviceId,
          serviceName: pickI18n(service.name, DEFAULT_LANGUAGE) || service.code,
          estimatedPrice: service.quoteOnly ? 0 : price,
          estimatedMinutes: service.durationMinutes,
        };
      }),
    );
  }

  /** Kiem tra chuyen tiep hop le theo RD muc 5.1 truoc khi ghi. */
  private async assertTransition(id: string, to: BookingStatus): Promise<Booking> {
    const booking = await this.findById(id);
    const allowed = BOOKING_TRANSITIONS[booking.status];
    if (!allowed.includes(to)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Khong the chuyen lich hen tu ${booking.status} sang ${to}`,
        details: { from: booking.status, to, allowed },
      });
    }
    return booking;
  }

  private async recordHistory(
    booking: Booking,
    from: BookingStatus,
    to: BookingStatus,
    actor: Actor,
    note?: string,
  ): Promise<void> {
    await this.historyRepo.save(
      this.historyRepo.create({
        bookingId: booking.id,
        fromStatus: from,
        toStatus: to,
        action: 'STATUS_CHANGE',
        actorType: actor.type,
        actorId: actor.id ?? null,
        note: note ?? null,
      }),
    );
  }

  /**
   * Gui thong bao gan voi lich hen. Loi gui khong duoc lam hong thao tac nghiep vu
   * da thanh cong, nen chi ghi log va di tiep (FR-NOT-13).
   */
  private async notify(
    booking: Booking,
    event: NotificationEvent,
    extra: Record<string, string | number>,
  ): Promise<void> {
    try {
      const customer = booking.customer ?? (await this.customers.findById(booking.customerId));
      const variables = {
        bookingCode: booking.code,
        customerName: booking.contactName,
        scheduledAt: formatAppDateTime(booking.scheduledAt),
        serviceType: serviceTypeLabel(booking.serviceType),
        ...extra,
      };

      if (customer.notifySms) {
        await this.notifications.send({
          event,
          channel: NotificationChannel.SMS,
          language: customer.language,
          recipient: booking.contactPhone,
          customerId: customer.id,
          variables,
          relatedType: 'Booking',
          relatedId: booking.id,
        });
      }
      if (customer.notifyEmail && booking.contactEmail) {
        await this.notifications.send({
          event,
          channel: NotificationChannel.EMAIL,
          language: customer.language,
          recipient: booking.contactEmail,
          customerId: customer.id,
          variables,
          relatedType: 'Booking',
          relatedId: booking.id,
        });
      }
    } catch (error) {
      this.logger.error(`Khong gui duoc thong bao ${event} cho lich hen ${booking.code}`);
    }
  }
}

function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00+09:00`).getUTCDay();
}

function serviceTypeLabel(type: BookingServiceType): string {
  switch (type) {
    case BookingServiceType.MAINTENANCE:
      return 'Bao duong';
    case BookingServiceType.REPAIR:
      return 'Sua chua';
    default:
      return 'Bao duong va sua chua';
  }
}
