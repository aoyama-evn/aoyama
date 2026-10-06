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
  BOOKING_OPEN_STATUSES,
  BOOKING_TRANSITIONS,
  BookingServiceType,
  BookingStage,
  BookingStatus,
  DEFAULT_LANGUAGE,
  NotificationChannel,
  NotificationEvent,
  QuotationStatus,
  WorkOrderStatus,
} from 'src/common/enums';
import {
  formatAppDateTime,
  formatBookingCode,
  hoursBetween,
  normalizePhone,
  zonedDateTimeToUtc,
} from 'src/common/utils';
import { pickI18n } from 'src/common/types';
import { CatalogService } from 'src/modules/catalog/catalog.service';
import { CustomersService } from 'src/modules/customers/customers.service';
import { AdminNotificationsService } from 'src/modules/notifications/admin-notifications.service';
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
    private readonly adminFeed: AdminNotificationsService,
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

    const submittedAt = new Date();

    const booking = await this.dataSource.transaction(async (manager) => {
      /**
       * So thu tu la "lich thu may cua khach nay", nen dem ca lich da huy —
       * khong thi huy mot lich la ma cua lich tiep theo trung voi ma cu.
       *
       * Dem trong cung giao dich voi luc ghi, va neu van dung ma (hai thiet
       * bi cung bam gui trong mot phut) thi nhich so thu tu len cho den khi
       * trong. Vong lap co chan tren de khong bao gio quay mai.
       */
      const bookingRepo = manager.getRepository(Booking);
      const taken = await bookingRepo.count({ where: { customerId: customer.id } });

      let code = formatBookingCode(submittedAt, taken);
      for (let bump = 1; bump <= 50; bump += 1) {
        if ((await bookingRepo.count({ where: { code } })) === 0) break;
        code = formatBookingCode(submittedAt, taken + bump);
      }

      const entity = bookingRepo.create({
        code,
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
        symptomVideoUrl: dto.symptomVideoUrl ?? null,
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

    // FR-QR-01 — sinh ma QR ngay khi dat lich thanh cong. Ban thiet ke ve ma
    // QR ngay tren SC-16 nen khach phai co ma de luu lai tu luc nay, khong doi
    // den khi cua hang xac nhan.
    await this.qr.issueToken(booking);

    /**
     * Dat lich thanh cong la viec cua CUA HANG, khong phai cua khach.
     *
     * Khach vua bam xong va dang nhin thang vao man "dat lich thanh cong",
     * nhan them mot tin nhan ke lai dieu ho vua lam la thua. Nguoi can biet
     * la nhan vien: co lich moi cho xac nhan.
     */
    await this.adminFeed.push({
      event: NotificationEvent.BOOKING_CREATED,
      title: `Lich hen moi ${booking.code}`,
      // Ngon ngu cua hang, khong phai cua khach: day la tin noi bo.
      body: `${booking.contactName} · ${formatAppDateTime(booking.scheduledAt)} · ${pickI18n(
        store.name,
        DEFAULT_LANGUAGE,
      )}`,
      link: `/admin/bookings/${booking.id}`,
      storeId: booking.storeId,
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
    await this.attachStages([booking]);
    return booking;
  }

  async findByCode(code: string): Promise<Booking> {
    const booking = await this.repo.findOne({
      where: { code: code.trim().toUpperCase() },
      relations: {
        customer: true,
        vehicle: true,
        store: true,
        services: true,
        // SC-26 ve ca chang lich hen tren dong thoi gian nen phai nap kem.
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

  /**
   * SC-20 — Guest tra cuu bang MOT o duy nhat: ma lich hen hoac so dien thoai.
   *
   * Giong o tiep nhan cua le tan: khach khong phai chon kieu tra cuu, go gi
   * he thong thu nay. Ma lich hen la dinh danh duy nhat nen thu truoc; khong
   * ra thi coi la so dien thoai.
   */
  async lookupForGuest(term: string): Promise<{ code: string }> {
    const raw = (term ?? '').trim();
    if (raw.length < 6) {
      throw new BadRequestException({
        code: 'LOOKUP_TOO_SHORT',
        message: 'Can it nhat 6 ky tu de tra cuu',
      });
    }

    const booking = (await this.lookupByCode(raw)) ?? (await this.lookupByPhone(raw));
    if (!booking) {
      throw new NotFoundException({
        code: 'BOOKING_NOT_FOUND',
        message: 'Khong tim thay lich hen khop voi ma lich hen hoac so dien thoai vua nhap',
      });
    }

    /**
     * Chi tra ve ma lich hen.
     *
     * Day la duong cong khai: go dung mot so dien thoai la co ket qua. Tra
     * ve ca thuc the thi kem theo qrToken — thu le tan quet de tiep nhan xe
     * — cung ten, email va ghi chu noi bo. Man hinh goi den day chi can ma
     * de dieu huong sang trang tien do, nen dua dung chung do.
     */
    return { code: booking.code };
  }

  private async lookupByCode(term: string): Promise<Booking | null> {
    return this.repo.findOne({ where: { code: term.toUpperCase() } });
  }

  /**
   * Tim theo so dien thoai khi khach khong con nho ma lich hen.
   *
   * So da luu o dang E.164 ("+84969376966"), con khach go theo thoi quen
   * trong nuoc ("0969376966"). Bo dau cong, dau cach va so 0 dung dau roi
   * khop phan duoi thi ca hai cach go deu ra. Doi it nhat 8 chu so de mot
   * chuoi ngan khong quet trung lich cua nguoi la.
   *
   * Khach co the co nhieu lich; tra ve cai dang mo va gan nhat, vi do la
   * cai ho vao day de xem.
   */
  private async lookupByPhone(term: string): Promise<Booking | null> {
    const needle = term.replace(/\D/g, '').replace(/^0+/, '');
    if (needle.length < 8) return null;

    return this.repo
      .createQueryBuilder('b')
      .leftJoin('b.customer', 'c')
      .where(
        `(regexp_replace(b.contact_phone, '[^0-9]', '', 'g') LIKE :tail
          OR regexp_replace(c.phone, '[^0-9]', '', 'g') LIKE :tail)`,
        { tail: `%${needle}` },
      )
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED })
      .addSelect(
        `CASE b.status
           WHEN '${BookingStatus.CONFIRMED}' THEN 0
           WHEN '${BookingStatus.PENDING}' THEN 1
           ELSE 2 END`,
        'uu_tien',
      )
      .orderBy('uu_tien', 'ASC')
      .addOrderBy('b.scheduledAt', 'DESC')
      .getOne();
  }

  /** SC-21 — lich hen cua khach dang dang nhap. */
  async findByCustomer(customerId: string, query: BookingQueryDto): Promise<PageDto<Booking>> {
    const qb = this.baseQuery().where('b.customer_id = :customerId', { customerId });
    this.applyFilters(qb, query);
    const [items, total] = await qb
      .orderBy('b.scheduledAt', query.sortOrder)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    await this.attachPendingQuotations(items);
    return new PageDto(items, total, query);
  }

  /**
   * Gan ban bao gia dang cho khach tra loi vao tung lich hen.
   *
   * Doc thang bang quotations bang mot cau truy van chung cho ca trang thay
   * vi goi QuotationsService: dich vu do di qua WorkOrdersService, ma
   * WorkOrdersService lai dung chinh lop nay — vong phu thuoc.
   */
  private async attachPendingQuotations(bookings: Booking[]): Promise<void> {
    const ids = bookings.map((b) => b.id);
    if (ids.length === 0) return;

    // DISTINCT ON: mot phieu co the da gui lai bao gia nhieu lan, chi lay ban moi nhat.
    const rows: {
      bookingId: string;
      token: string;
      code: string;
      totalAmount: number;
      validUntil: Date | null;
    }[] = await this.dataSource.query(
      `select distinct on (w.booking_id)
         w.booking_id as "bookingId",
         q.public_token as "token",
         q.code as "code",
         q.total_amount as "totalAmount",
         q.valid_until as "validUntil"
       from quotations q
       join work_orders w on w.id = q.work_order_id
       where w.booking_id = ANY($1)
         and q.status = $2
         and w.status = ANY($3)
       order by w.booking_id, q.created_at desc`,
      /**
       * Phieu da bat tay vao sua thi khong con cho khach tra loi nua, du ban
       * bao gia van nam o SENT vi khach dong y mieng tai quay. Khong chan lai
       * thi khach thay "Cho duyet bao gia" tren chiec xe tho may dang sua do.
       */
      [
        ids,
        QuotationStatus.SENT,
        [WorkOrderStatus.RECEIVED, WorkOrderStatus.DIAGNOSING, WorkOrderStatus.QUOTED],
      ],
    );

    const byBooking = new Map(rows.map((r) => [r.bookingId, r]));
    for (const booking of bookings) {
      const found = byBooking.get(booking.id);
      booking.pendingQuotation = found
        ? {
            token: found.token,
            code: found.code,
            totalAmount: Number(found.totalAmount),
            validUntil: found.validUntil ? found.validUntil.toISOString() : null,
          }
        : null;
    }
  }

  /**
   * Tinh buoc hien thi cho tung lich hen — mot cau truy van cho ca trang.
   *
   * Lich hen chua vao xuong thi buoc chinh la trang thai cua no. Vao xuong
   * roi thi buoc nam o phieu dich vu va ban bao gia, nen phai hoi them —
   * nhung hoi mot lan cho ca danh sach, khong phai moi dong mot lan.
   */
  private async attachStages(bookings: Booking[]): Promise<void> {
    const ids = bookings.map((b) => b.id);
    if (ids.length === 0) return;

    const rows: {
      bookingId: string;
      workOrderId: string | null;
      woStatus: string | null;
      quoteStatus: string | null;
      started: boolean | null;
    }[] = await this.dataSource.query(
      `select b.id as "bookingId",
              w.id as "workOrderId",
              w.status as "woStatus",
              q.status as "quoteStatus",
              exists(
                select 1 from work_order_items i
                 where i.work_order_id = w.id and i.state <> 'PENDING'
              ) as "started"
         from bookings b
         left join lateral (
           select * from work_orders w2
            where w2.booking_id = b.id
            order by w2.created_at desc limit 1
         ) w on true
         left join lateral (
           select * from quotations q2
            where q2.work_order_id = w.id
            order by q2.version desc limit 1
         ) q on true
        where b.id = ANY($1)`,
      [ids],
    );

    const byBooking = new Map(rows.map((r) => [r.bookingId, r]));
    for (const booking of bookings) {
      const row = byBooking.get(booking.id);
      booking.stage = resolveStage(booking.status, row);
      booking.workOrderId = row?.workOrderId ?? null;
    }
  }

  /** SC-26 — WorkOrdersService hoi rieng mot lich hen khi dung tien do. */  /** SC-26 — WorkOrdersService hoi rieng mot lich hen khi dung tien do. */
  async findPendingQuotation(bookingId: string): Promise<Booking['pendingQuotation']> {
    const holder = { id: bookingId } as Booking;
    await this.attachPendingQuotations([holder]);
    return holder.pendingQuotation ?? null;
  }

  /**
   * Ban bao gia moi nhat cua lich hen, bat ke da tra loi hay chua.
   *
   * Khac findPendingQuotation o cho khong loc theo trang thai. Chot xong
   * roi khach van muon mo lai xem minh da dong y nhung gi va het bao nhieu
   * — man SC-27 tu an cac nut dong y, tu choi, xem lai khi ban bao gia
   * khong con cho tra loi.
   */
  async findLatestQuotation(bookingId: string): Promise<{
    token: string;
    code: string;
    totalAmount: number;
    status: string;
  } | null> {
    const rows: {
      token: string;
      code: string;
      totalAmount: string;
      status: string;
    }[] = await this.dataSource.query(
      `select q.public_token as "token",
              q.code as "code",
              q.total_amount as "totalAmount",
              q.status as "status"
         from quotations q
         join work_orders w on w.id = q.work_order_id
        where w.booking_id = $1
        order by q.created_at desc
        limit 1`,
      [bookingId],
    );
    const found = rows[0];
    return found ? { ...found, totalAmount: Number(found.totalAmount) } : null;
  }

  /** SA-03 — danh sach lich hen phia quan tri. */
  /** SA-03 — danh sach lich hen phia quan tri; kem buoc hien thi. */
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
    await this.attachStages(items);
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

  /**
   * SA-05 — Admin xac nhan lich hen va gui SMS (Luong B).
   *
   * Ma QR da co tu luc khach dat lich; goi issueToken o day chi de vet nhung
   * lich cu tao truoc khi doi cach sinh ma — ham nay khong cap lai ma neu da co.
   */
  /**
   * SA-03 — xac nhan nhieu lich hen trong mot lan bam.
   *
   * Le tan mo may buoi sang thuong co ca chuc lich cho duyet; xac nhan tung
   * cai mot la vao chi tiet roi quay ra, lap lai hang chuc lan. O day chay
   * tuan tu tung cai de moi lich van di qua dung quy trinh (sinh ma QR, ghi
   * nhat ky, gui SMS) chu khong ghi thang mot phat vao CSDL.
   *
   * Mot lich hong khong lam hong ca me: thu nao loi thi ghi lai ly do va di
   * tiep, cuoi cung tra ve ca hai danh sach de man hinh noi ro cai nao khong
   * xac nhan duoc va vi sao.
   */
  async confirmMany(
    ids: string[],
    actor: Actor,
  ): Promise<{ confirmed: string[]; failed: { id: string; message: string }[] }> {
    const confirmed: string[] = [];
    const failed: { id: string; message: string }[] = [];

    for (const id of ids) {
      try {
        await this.confirm(id, actor);
        confirmed.push(id);
      } catch (error) {
        const body = (error as { response?: { message?: string } }).response;
        failed.push({ id, message: body?.message ?? (error as Error).message });
      }
    }

    return { confirmed, failed };
  }

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
      /**
       * Xe da vao xuong roi thi khach khong tu huy tren dien thoai duoc nua —
       * phai goi cua hang, vi con chiec xe dang nam trong xuong va cong viec
       * dang lam do. Moc gio o duoi thuong da chan san truong hop nay vi gio
       * hen da troi qua, nhung khach gui xe som hon hen thi van lot.
       */
      if (booking.status === BookingStatus.RECEIVED) {
        throw new BadRequestException({
          code: 'CANCEL_AFTER_INTAKE',
          message: 'Xe da duoc tiep nhan vao xuong. Vui long goi cua hang de huy.',
        });
      }

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
    if (dto.symptomDescription !== undefined) {
      booking.symptomDescription = dto.symptomDescription || null;
    }
    // Doi lich thi nhac lich cu khong con dung nua.
    booking.reminderSentAt = null;
    await this.repo.save(booking);

    // SC-23 — khach sua luon hang muc va so km trong cung mot lan luu.
    if (dto.serviceIds?.length) {
      const lineRepo = this.repo.manager.getRepository(BookingServiceLine);
      const lines = await this.buildServiceLines(dto.serviceIds, storeId, booking.vehicleId);
      await lineRepo.delete({ bookingId: booking.id });
      await lineRepo.insert(lines.map((line) => ({ ...line, bookingId: booking.id })));
    }
    if (dto.odometer !== undefined && booking.vehicleId) {
      await this.vehicles.updateOdometer(booking.vehicleId, dto.odometer);
    }

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
    if (query.upcoming) {
      qb.andWhere('b.scheduled_at >= :now', { now: new Date() }).andWhere(
        'b.status IN (:...openStatuses)',
        { openStatuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      );
    }
    if (query.active) {
      qb.andWhere('b.status IN (:...activeStatuses)', {
        activeStatuses: BOOKING_OPEN_STATUSES,
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
      /**
       * Khach vang lai co the dat lich ma chua khai xe. De trong thi tin
       * nhan con lai mot dong "Xe" cut ngun, nen dien dau gach.
       */
      const vehicle = booking.vehicle
        ? [booking.vehicle.maker, booking.vehicle.model, booking.vehicle.plateNumber]
            .filter(Boolean)
            .join(' ')
        : '—';
      const variables = {
        bookingCode: booking.code,
        customerName: booking.contactName,
        vehicle,
        scheduledAt: formatAppDateTime(booking.scheduledAt),
        serviceType: serviceTypeLabel(booking.serviceType),
        ...extra,
      };
      // Moi tin nhan deu dan khach ve mot cho xem duoc day du tinh hinh.
      const linkPath = `/bookings/${booking.code}/progress`;

      if (customer.notifySms) {
        await this.notifications.send({
          event,
          channel: NotificationChannel.SMS,
          language: customer.language,
          recipient: booking.contactPhone,
          customerId: customer.id,
          variables,
          linkPath,
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
          linkPath,
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
    case BookingServiceType.INSPECTION:
      return 'Kiem tra';
    default:
      return 'Nhieu loai dich vu';
  }
}

/**
 * Lich hen dang o buoc nao, nhin tu trang quan tri.
 *
 * Huy va khong den la ket cuc rieng, khong di theo day chuyen. Chua vao
 * xuong thi buoc chinh la trang thai cua lich. Vao roi thi doc tu phieu
 * dich vu va ban bao gia.
 */
function resolveStage(
  status: BookingStatus,
  row?: { woStatus: string | null; quoteStatus: string | null; started: boolean | null },
): BookingStage {
  if (status === BookingStatus.CANCELLED) return BookingStage.CANCELLED;
  if (status === BookingStatus.NO_SHOW) return BookingStage.NO_SHOW;
  if (status === BookingStatus.PENDING) return BookingStage.PENDING;
  if (status === BookingStatus.CONFIRMED) return BookingStage.CONFIRMED;

  switch (row?.woStatus) {
    case WorkOrderStatus.DELIVERED:
      return BookingStage.DELIVERED;
    /**
     * Sua xong roi nhung chua thu tien, chua giao xe — buoc nay hien ra
     * cho le tan voi ten "Cho thanh toan".
     *
     * Truoc goi la "Da xong", ma mot lich ghi da xong trong khi xe con
     * nam trong xuong va chua ai tra tien thi coi nhu xong trong mat
     * nguoi doc danh sach. Chi dong han khi da ban giao.
     */
    case WorkOrderStatus.COMPLETED:
      return BookingStage.COMPLETED;
    case WorkOrderStatus.IN_PROGRESS:
      return BookingStage.IN_PROGRESS;
    case WorkOrderStatus.QUOTED:
      /**
       * Phieu o QUOTED om hai buoc khac nhau: dang cho khach tra loi, va
       * khach da chot nhung xuong chua bam "Tien hanh". Phan biet bang
       * trang thai cua chinh ban bao gia.
       */
      if (row.quoteStatus === QuotationStatus.ACCEPTED) return BookingStage.QUOTE_ACCEPTED;
      return row.quoteStatus === QuotationStatus.SENT
        ? BookingStage.QUOTING
        : BookingStage.DIAGNOSED;
    case WorkOrderStatus.DIAGNOSING:
      return BookingStage.DIAGNOSED;
    default:
      // RECEIVED, phieu da huy, hoac chua co phieu nao.
      return status === BookingStatus.DONE ? BookingStage.DELIVERED : BookingStage.RECEIVED;
  }
}
