import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageDto } from 'src/common/dto';
import {
  NotificationChannel,
  NotificationEvent,
  PaymentStatus,
  ServiceType,
  WORK_ORDER_TRANSITIONS,
  WorkOrderStatus,
  WorkItemState,
} from 'src/common/enums';
import { applyTax, formatAppDateTime, sumLines, yen } from 'src/common/utils';
import { Actor, BookingsService } from 'src/modules/bookings/bookings.service';
import { CustomersService } from 'src/modules/customers/customers.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { InventoryService } from 'src/modules/parts/inventory.service';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { VehiclesService } from 'src/modules/vehicles/vehicles.service';
import {
  AddPhotoDto,
  IntakeDto,
  UpdateAmountsDto,
  UpdateDiagnosisDto,
  UpdateProgressDto,
  WorkOrderQueryDto,
} from './dto/work-order.dto';
import { WorkOrder } from './entities/work-order.entity';
import { WorkOrderItem } from './entities/work-order-item.entity';
import { WorkOrderPart } from './entities/work-order-part.entity';
import { WorkOrderPhoto } from './entities/work-order-photo.entity';
import { WorkOrderStatusHistory } from './entities/work-order-status-history.entity';

/** M-06 — Phieu dich vu. SA-08..SA-11, SC-26, SC-32. */
@Injectable()
export class WorkOrdersService {
  private readonly logger = new Logger(WorkOrdersService.name);

  constructor(
    @InjectRepository(WorkOrder) private readonly repo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderPhoto) private readonly photoRepo: Repository<WorkOrderPhoto>,
    @InjectRepository(WorkOrderStatusHistory)
    private readonly historyRepo: Repository<WorkOrderStatusHistory>,
    private readonly dataSource: DataSource,
    private readonly bookings: BookingsService,
    private readonly customers: CustomersService,
    private readonly vehicles: VehiclesService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
  ) {}

  // ---------------- Tiep nhan xe (SA-08) ----------------

  /**
   * FR-WO-01, FR-WO-03 — mo phieu khi xe vao xuong.
   * Lich hen chuyen sang RECEIVED trong cung giao dich de khong co truong hop
   * phieu da mo ma lich hen van con o trang thai cu.
   */
  async intake(dto: IntakeDto, actor: Actor): Promise<WorkOrder> {
    if (dto.intakePhotoUrls.length === 0) {
      throw new BadRequestException({
        code: 'INTAKE_PHOTO_REQUIRED',
        message: 'Can it nhat mot anh hien trang xe khi tiep nhan',
      });
    }

    let customerId = dto.customerId ?? null;
    let vehicleId = dto.vehicleId ?? null;
    let storeId = dto.storeId ?? null;
    let customerSymptom = dto.customerSymptom ?? null;

    if (dto.bookingId) {
      const booking = await this.bookings.findById(dto.bookingId);
      customerId = booking.customerId;
      vehicleId = dto.vehicleId ?? booking.vehicleId;
      storeId = booking.storeId;
      customerSymptom = dto.customerSymptom ?? booking.symptomDescription;

      const existing = await this.repo.findOne({ where: { bookingId: booking.id } });
      if (existing) {
        throw new BadRequestException({
          code: 'WORK_ORDER_EXISTS',
          message: 'Lich hen nay da co phieu dich vu',
          details: { workOrderId: existing.id },
        });
      }
    }

    if (!customerId || !vehicleId || !storeId) {
      throw new BadRequestException({
        code: 'INTAKE_MISSING_DATA',
        message: 'Can day du khach hang, xe va cua hang de mo phieu dich vu',
      });
    }

    const resolvedCustomerId = customerId;
    const resolvedVehicleId = vehicleId;
    const resolvedStoreId = storeId;

    const workOrder = await this.dataSource.transaction(async (manager) => {
      const entity = manager.getRepository(WorkOrder).create({
        code: await this.nextCode(),
        bookingId: dto.bookingId ?? null,
        customerId: resolvedCustomerId,
        vehicleId: resolvedVehicleId,
        storeId: resolvedStoreId,
        status: WorkOrderStatus.RECEIVED,
        paymentStatus: PaymentStatus.UNPAID,
        intakeOdometer: dto.intakeOdometer,
        intakeFuelLevel: dto.intakeFuelLevel ?? null,
        intakeAccessories: dto.intakeAccessories ?? null,
        intakeNote: dto.intakeNote ?? null,
        customerSymptom,
        receivedById: actor.id ?? null,
        taxRate: this.settings.getNumber(SETTING_KEYS.TAX_RATE_PERCENT, undefined, 10),
      });
      const saved = await manager.getRepository(WorkOrder).save(entity);

      await manager.getRepository(WorkOrderPhoto).save(
        dto.intakePhotoUrls.map((url) =>
          manager.getRepository(WorkOrderPhoto).create({
            workOrderId: saved.id,
            stage: 'INTAKE',
            url,
            visibleToCustomer: false,
            uploadedById: actor.id ?? null,
          }),
        ),
      );

      await manager.getRepository(WorkOrderStatusHistory).save(
        manager.getRepository(WorkOrderStatusHistory).create({
          workOrderId: saved.id,
          fromStatus: null,
          toStatus: WorkOrderStatus.RECEIVED,
          actorId: actor.id ?? null,
          note: 'Tiep nhan xe',
        }),
      );

      return saved;
    });

    if (dto.bookingId) {
      await this.bookings.markReceived(dto.bookingId, actor);
    }
    await this.vehicles.updateOdometer(resolvedVehicleId, dto.intakeOdometer);

    return this.findById(workOrder.id);
  }

  // ---------------- Doc ----------------

  async findById(id: string): Promise<WorkOrder> {
    const workOrder = await this.repo.findOne({
      where: { id },
      relations: {
        customer: true,
        vehicle: true,
        store: true,
        booking: true,
        // SA-10 hien ten ky thuat vien phu trach ngay tren the tom tat.
        assignedTechnician: true,
        // Dong ky ten duoi ket qua chan doan.
        diagnosedBy: true,
        items: { service: true },
        parts: true,
        photos: true,
        statusHistories: true,
      },
      order: { items: { sortOrder: 'ASC' }, statusHistories: { createdAt: 'ASC' } },
    });
    if (!workOrder) {
      throw new NotFoundException({
        code: 'WORK_ORDER_NOT_FOUND',
        message: 'Khong tim thay phieu dich vu',
      });
    }
    return workOrder;
  }

  async findByBooking(bookingId: string): Promise<WorkOrder | null> {
    return this.repo.findOne({
      where: { bookingId },
      // diagnosedBy: SC-26 ke ten ky thuat vien da kham xe duoi moc chan doan.
      relations: {
        items: true,
        parts: true,
        photos: true,
        statusHistories: true,
        diagnosedBy: true,
      },
    });
  }

  /** SA-09 — danh sach phieu dich vu. */
  async search(query: WorkOrderQueryDto): Promise<PageDto<WorkOrder>> {
    const qb = this.repo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.customer', 'c')
      .leftJoinAndSelect('w.vehicle', 'v')
      .leftJoinAndSelect('w.store', 's');

    if (query.storeId) qb.andWhere('w.store_id = :storeId', { storeId: query.storeId });
    if (query.customerId) {
      qb.andWhere('w.customer_id = :customerId', { customerId: query.customerId });
    }
    if (query.bookingId) {
      qb.andWhere('w.booking_id = :bookingId', { bookingId: query.bookingId });
    }
    if (query.status) qb.andWhere('w.status = :status', { status: query.status });
    if (query.paymentStatus) {
      qb.andWhere('w.payment_status = :ps', { ps: query.paymentStatus });
    }

    /** SA-09 — ba nut loc nhanh; dinh nghia nam o day de moi man hieu giong nhau. */
    switch (query.bucket) {
      case 'IN_SHOP':
        qb.andWhere('w.status NOT IN (:...closed)', {
          closed: [WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED],
        });
        break;
      case 'AWAITING_PAYMENT':
        /**
         * "Cho thanh toan" = da xong viec ma chua thu du tien, chu khong phai
         * moi phieu chua tra. Phieu dang chan doan thi dang nhien chua tra —
         * cho no vao day thi nut mat tac dung, va canh bao "qua 7 ngay chua
         * thu" cua ban thiet ke cung vo nghia vi tien chua den han.
         */
        qb.andWhere('w.status IN (:...done)', {
          done: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
        })
          .andWhere('w.payment_status != :paid', { paid: PaymentStatus.PAID })
          .andWhere('w.total_amount > 0');
        break;
      case 'AWAITING_QUOTE':
        qb.andWhere('w.status = :quoted', { quoted: WorkOrderStatus.QUOTED });
        break;
      default:
        break;
    }
    if (query.from) qb.andWhere('w.created_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('w.created_at <= :to', { to: query.to });
    if (query.keyword) {
      qb.andWhere(
        '(w.code ILIKE :kw OR c.name ILIKE :kw OR c.phone ILIKE :kw OR v.plate_number ILIKE :kw)',
        { kw: `%${query.keyword}%` },
      );
    }

    const [items, total] = await qb
      .orderBy('w.createdAt', query.sortOrder)
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  /** SC-26 — tien do rut gon cho khach, chi gom moc va anh duoc phep hien. */
  /**
   * SC-26 — mot dong thoi gian duy nhat tu luc dat lich den luc ban giao.
   * Ban thiet ke ve ca chang lich hen lan chang phieu dich vu chung mot cot,
   * nen tra ve ca hai phan cung the xe va so km luc tiep nhan.
   */
  /** Gio khach bam dong y bao gia — null khi chua chot. */
  private async quoteAcceptedAt(workOrderId?: string): Promise<string | null> {
    if (!workOrderId) return null;
    const [row] = await this.dataSource.query<{ respondedAt: Date | null }[]>(
      `select responded_at as "respondedAt"
         from quotations
        where work_order_id = $1 and status = 'ACCEPTED'
        order by responded_at desc nulls last
        limit 1`,
      [workOrderId],
    );
    return row?.respondedAt ? row.respondedAt.toISOString() : null;
  }

  async getPublicProgress(bookingCode: string) {
    const booking = await this.bookings.findByCode(bookingCode);
    const workOrder = await this.findByBooking(booking.id);

    const bookingTimeline = (booking.statusHistories ?? []).map((h) => ({
      status: h.toStatus,
      at: h.createdAt,
      note: h.note,
    }));

    const base = {
      bookingCode,
      bookingStatus: booking.status,
      bookingTimeline,
      hasQr: Boolean(booking.qrToken),
      /**
       * Nut "Xem bao gia" o SC-26 can duong dan toi ban bao gia that. Truoc
       * day no dan ve man chi tiet lich hen, va khach bam vao thi nhan duoc
       * mot cai ma QR chu khong phai bao gia.
       */
      pendingQuotation: await this.bookings.findPendingQuotation(booking.id),
      /**
       * Luc khach chot bao gia khong nam trong lich su trang thai phieu —
       * no la viec cua ban bao gia. Nhung tren duong thoi gian cua khach
       * day la mot moc rieng, nen tra ve de SC-26 danh dau duoc.
       */
      quoteAcceptedAt: await this.quoteAcceptedAt(workOrder?.id),
      vehicle: booking.vehicle
        ? {
            maker: booking.vehicle.maker,
            model: booking.vehicle.model,
            plateNumber: booking.vehicle.plateNumber,
          }
        : null,
    };

    if (!workOrder) {
      return { ...base, hasWorkOrder: false };
    }
    return {
      ...base,
      hasWorkOrder: true,
      status: workOrder.status,
      intakeOdometer: workOrder.intakeOdometer,
      intakeFuelLevel: workOrder.intakeFuelLevel,
      totalAmount: workOrder.totalAmount,
      /**
       * Khach theo doi den dau thi thay chi tiet den do: da tiep nhan thi
       * biet xe vao xuong trong tinh trang nao, dang sua thi biet tho dang
       * lam hang muc nao va con lai nhung gi.
       */
      intakeAccessories: workOrder.intakeAccessories,
      customerSymptom: workOrder.customerSymptom,
      /**
       * Ket qua chan doan va nguoi da kham xe.
       *
       * Chi tra ve TEN ky thuat vien, khong phai ca ban ghi tai khoan:
       * day la duong dan cong khai, khach khong can biet ten dang nhap
       * hay so dien thoai noi bo cua nhan vien.
       */
      diagnosedByName: workOrder.diagnosedBy?.fullName ?? null,
      diagnosedAt: workOrder.diagnosedAt,
      diagnosisNote: workOrder.diagnosisNote,
      diagnosisCause: workOrder.diagnosisCause,
      // Chi ten va tien do — gia nam o ban bao gia, khong nhac lai o day.
      items: (workOrder.items ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((i) => ({ name: i.name, state: i.state })),
      progressPercent: workOrder.progressPercent,
      progressNote: workOrder.progressNote,
      estimatedCompletionAt: workOrder.estimatedCompletionAt,
      timeline: (workOrder.statusHistories ?? [])
        .filter((h) => h.visibleToCustomer)
        .map((h) => ({ status: h.toStatus, at: h.createdAt, note: h.note })),
      photos: (workOrder.photos ?? [])
        .filter((p) => p.visibleToCustomer)
        .map((p) => ({ url: p.url, caption: p.caption, stage: p.stage })),
    };
  }

  // ---------------- Chan doan va hang muc (SA-11) ----------------

  /**
   * FR-WO-04..06 — ghi chan doan, thay toan bo hang muc va phu tung.
   * Thay ca danh sach thay vi vá tung dong: man hinh SA-11 gui len trang thai
   * cuoi cung cua bang, nen cach nay khop voi thao tac nguoi dung va tranh
   * tinh trang dong da xoa o giao dien van con trong CSDL.
   */
  async updateDiagnosis(id: string, dto: UpdateDiagnosisDto, actor: Actor): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    if ([WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED].includes(workOrder.status)) {
      throw new BadRequestException({
        code: 'WORK_ORDER_CLOSED',
        message: 'Phieu da dong, khong sua duoc',
      });
    }

    await this.dataSource.transaction(async (manager) => {
      /**
       * Dung insert() va update() thay vi save() tren thuc the da nap kem quan he:
       * WorkOrder khai bao cascade cho items va parts, nen save() se ghi de bang
       * ban sao cu dang nam trong bo nho va lam hong du lieu vua thay.
       */
      if (dto.items) {
        await manager.getRepository(WorkOrderItem).delete({ workOrderId: id });
        if (dto.items.length > 0) {
          await manager.getRepository(WorkOrderItem).insert(
            dto.items.map((item, index) => ({
              workOrderId: id,
              serviceId: item.serviceId ?? null,
              name: item.name,
              description: item.description ?? null,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              laborMinutes: item.laborMinutes ?? null,
              suggestedByAi: item.suggestedByAi ?? false,
              state: item.state ?? WorkItemState.PENDING,
              sortOrder: item.sortOrder ?? index,
            })),
          );
        }
      }

      if (dto.parts) {
        await manager.getRepository(WorkOrderPart).delete({ workOrderId: id });
        if (dto.parts.length > 0) {
          await manager.getRepository(WorkOrderPart).insert(
            dto.parts.map((part) => ({
              workOrderId: id,
              partId: part.partId ?? null,
              partName: part.partName,
              partCode: part.partCode ?? null,
              unitPrice: part.unitPrice,
              quantity: part.quantity,
              suggestedByAi: part.suggestedByAi ?? false,
            })),
          );
        }
      }

      const patch: Partial<WorkOrder> = {};
      if (dto.diagnosisNote !== undefined) patch.diagnosisNote = dto.diagnosisNote;
      if (dto.diagnosisCause !== undefined) patch.diagnosisCause = dto.diagnosisCause;
      if (dto.difficulty !== undefined) patch.difficulty = dto.difficulty;
      if (dto.assignedTechnicianId !== undefined) {
        patch.assignedTechnicianId = dto.assignedTechnicianId;
      }

      /**
       * Ky ten nguoi kham xe. Chi ghi khi lan luu nay thuc su co chu chan
       * doan — bam luu de doi hang muc hay phan cong lai thi nguoi da kham
       * truoc do van giu nguyen, khong bi nguoi sau de len.
       */
      const wroteDiagnosis =
        (dto.diagnosisNote ?? '').trim().length > 0 || (dto.diagnosisCause ?? '').trim().length > 0;
      if (wroteDiagnosis && actor.id) {
        patch.diagnosedById = actor.id;
        patch.diagnosedAt = new Date();
      }

      // Buoc ghi chan doan dau tien dua phieu sang DIAGNOSING.
      if (workOrder.status === WorkOrderStatus.RECEIVED) {
        patch.status = WorkOrderStatus.DIAGNOSING;
        patch.diagnosingAt = new Date();
        await manager.getRepository(WorkOrderStatusHistory).insert({
          workOrderId: id,
          fromStatus: WorkOrderStatus.RECEIVED,
          toStatus: WorkOrderStatus.DIAGNOSING,
          actorId: actor.id ?? null,
        });
      }

      if (Object.keys(patch).length > 0) {
        await manager.getRepository(WorkOrder).update(id, patch);
      }
    });

    await this.recalculateAmounts(id);
    return this.findById(id);
  }

  /**
   * SA-10 — tho danh dau mot hang muc dang lam hay da xong.
   *
   * Tien do phan tram cua ca phieu tu tinh lai theo so hang muc da xong,
   * de khach o SC-26 thay thanh tien do nhuc nhich that chu khong phai mot
   * con so nhan vien phai nho cap nhat bang tay.
   */
  async updateItemState(
    workOrderId: string,
    itemId: string,
    state: WorkItemState,
  ): Promise<WorkOrder> {
    const repo = this.dataSource.getRepository(WorkOrderItem);
    const item = await repo.findOne({ where: { id: itemId, workOrderId } });
    if (!item) {
      throw new NotFoundException({
        code: 'WORK_ORDER_ITEM_NOT_FOUND',
        message: 'Khong tim thay hang muc trong phieu nay',
      });
    }

    await repo.update(itemId, { state });

    const all = await repo.find({ where: { workOrderId } });
    const done = all.filter((x) => x.state === WorkItemState.DONE).length;
    const percent = all.length === 0 ? 0 : Math.round((done / all.length) * 100);
    await this.repo.update(workOrderId, { progressPercent: percent });

    return this.findById(workOrderId);
  }

  /** BR-38 — tinh lai tong tien tu hang muc va phu tung hien co. */
  async recalculateAmounts(id: string): Promise<WorkOrder> {
    const workOrder = await this.repo.findOneOrFail({
      where: { id },
      relations: { items: true, parts: true },
    });

    const laborSubtotal = sumLines(
      (workOrder.items ?? []).map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
    );
    const partsSubtotal = sumLines(
      (workOrder.parts ?? []).map((p) => ({ unitPrice: p.unitPrice, quantity: p.quantity })),
    );
    const beforeTax = Math.max(0, laborSubtotal + partsSubtotal - workOrder.discountAmount);
    const taxAmount = applyTax(beforeTax, workOrder.taxRate);

    // update() thay vi save(): thuc the vua nap co quan he cascade, save() se
    // ghi lai ca items va parts mot cach thua thai.
    await this.repo.update(id, {
      laborSubtotal,
      partsSubtotal,
      taxAmount,
      totalAmount: yen(beforeTax + taxAmount),
    });
    return this.repo.findOneOrFail({ where: { id } });
  }

  async updateAmounts(id: string, dto: UpdateAmountsDto): Promise<WorkOrder> {
    await this.findById(id);
    const patch: Partial<WorkOrder> = {};
    if (dto.discountAmount !== undefined) patch.discountAmount = dto.discountAmount;
    if (dto.taxRate !== undefined) patch.taxRate = dto.taxRate;
    if (Object.keys(patch).length > 0) await this.repo.update(id, patch);
    return this.recalculateAmounts(id);
  }

  // ---------------- Tien do va anh ----------------

  async updateProgress(id: string, dto: UpdateProgressDto): Promise<WorkOrder> {
    await this.findById(id);
    await this.repo.update(id, {
      progressPercent: dto.progressPercent,
      progressNote: dto.progressNote ?? null,
      estimatedCompletionAt: dto.estimatedCompletionAt ? new Date(dto.estimatedCompletionAt) : null,
    });
    return this.findById(id);
  }

  async addPhoto(id: string, dto: AddPhotoDto, actor: Actor): Promise<WorkOrderPhoto> {
    await this.findById(id);
    return this.photoRepo.save(
      this.photoRepo.create({
        workOrderId: id,
        stage: dto.stage,
        url: dto.url,
        caption: dto.caption ?? null,
        visibleToCustomer: dto.visibleToCustomer ?? false,
        uploadedById: actor.id ?? null,
      }),
    );
  }

  async removePhoto(id: string, photoId: string): Promise<void> {
    await this.photoRepo.delete({ id: photoId, workOrderId: id });
  }

  // ---------------- Chuyen trang thai ----------------

  /**
   * RD muc 5.2. Hai buoc co tac dung phu quan trong:
   * COMPLETED tru kho phu tung va ghi lich su xe (BR-30, BR-42);
   * CANCELLED hoan lai kho neu da tru.
   */
  async changeStatus(
    id: string,
    to: WorkOrderStatus,
    actor: Actor,
    note?: string,
  ): Promise<WorkOrder> {
    const workOrder = await this.findById(id);
    const allowed = WORK_ORDER_TRANSITIONS[workOrder.status];
    if (!allowed.includes(to)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Khong the chuyen phieu tu ${workOrder.status} sang ${to}`,
        details: { from: workOrder.status, to, allowed },
      });
    }

    /**
     * BR-42 — soat kho TRUOC khi ghi trang thai.
     *
     * Truoc day trang thai duoc ghi xuong roi moi goi onCompleted(); kho thieu
     * thi onCompleted nem loi nhung phieu da mang trang thai COMPLETED, khong
     * tru kho, khong ghi lich su dich vu va khong bao cho khach. Nhan vien
     * thay bao loi nhung phieu van "da hoan tat" — so sach sai ma khong ai
     * biet.
     */
    if (to === WorkOrderStatus.COMPLETED && !workOrder.stockDeducted) {
      const full = await this.findById(id);
      const lines = (full.parts ?? [])
        .filter((p) => p.partId)
        .map((p) => ({ partId: p.partId as string, quantity: p.quantity }));
      if (lines.length > 0) {
        await this.inventory.assertStockFor(full.storeId, lines);
      }
    }

    const from = workOrder.status;
    // update() thay vi save(): thuc the nap kem quan he cascade, save() se ghi
    // de lai items va parts bang ban sao dang nam trong bo nho.
    const patch: Partial<WorkOrder> = { status: to };

    switch (to) {
      case WorkOrderStatus.IN_PROGRESS:
        patch.startedAt = workOrder.startedAt ?? new Date();
        break;
      case WorkOrderStatus.COMPLETED:
        patch.completedAt = new Date();
        patch.progressPercent = 100;
        break;
      case WorkOrderStatus.DELIVERED:
        patch.deliveredAt = new Date();
        break;
      case WorkOrderStatus.CANCELLED:
        patch.cancelledAt = new Date();
        patch.cancelReason = note ?? null;
        break;
      default:
        break;
    }

    await this.repo.update(id, patch);
    Object.assign(workOrder, patch);

    await this.historyRepo.insert({
      workOrderId: id,
      fromStatus: from,
      toStatus: to,
      actorId: actor.id ?? null,
      note: note ?? null,
    });

    if (to === WorkOrderStatus.COMPLETED) {
      await this.onCompleted(workOrder, actor);
    }
    if (to === WorkOrderStatus.CANCELLED) {
      if (workOrder.stockDeducted) {
        await this.inventory.returnForWorkOrder(workOrder.id, actor.id ?? null);
        await this.repo.update(id, { stockDeducted: false });
      }
      await this.onCancelled(workOrder, actor, note);
    }
    if (to === WorkOrderStatus.DELIVERED) {
      await this.onDelivered(workOrder, actor);
    }

    return this.findById(id);
  }

  /** BR-30, BR-42 — tru kho, ghi lich su xe va bao khach xe da xong. */
  private async onCompleted(workOrder: WorkOrder, actor: Actor): Promise<void> {
    const full = await this.findById(workOrder.id);

    if (!full.stockDeducted && (full.parts ?? []).length > 0) {
      await this.inventory.deductForWorkOrder(
        full.id,
        full.storeId,
        (full.parts ?? [])
          .filter((p) => p.partId)
          .map((p) => ({ partId: p.partId as string, quantity: p.quantity })),
        actor.id ?? null,
      );
      await this.repo.update(full.id, { stockDeducted: true });
    }

    await this.vehicles.addHistory({
      vehicleId: full.vehicleId,
      workOrderId: full.id,
      storeId: full.storeId,
      servicedAt: full.completedAt ?? new Date(),
      type: inferServiceType(full),
      summary:
        (full.items ?? [])
          .map((i) => i.name)
          .join(', ')
          .slice(0, 250) || 'Dich vu',
      detail: full.diagnosisNote,
      odometer: full.intakeOdometer,
      totalAmount: full.totalAmount,
      itemNames: (full.items ?? []).map((i) => i.name),
    });

    await this.scheduleNextMaintenance(full);
    await this.notifyCustomer(full, NotificationEvent.WORK_ORDER_COMPLETED);
  }

  /**
   * Huy phieu thi dong luon lich hen di kem.
   *
   * Khong lam buoc nay thi lich hen nam lai o RECEIVED vinh vien: duong ra
   * duy nhat cua no la DONE luc ban giao, ma xe thi khong con duoc sua nua.
   * Lich do se mai bi dem la lich dang mo, va khach van thay "dang xu ly"
   * tren dien thoai.
   *
   * Dong lich that bai thi khong keo theo viec huy phieu — phieu la ban ghi
   * chinh, va con nguoi con sua tay duoc o man lich hen.
   */
  private async onCancelled(workOrder: WorkOrder, actor: Actor, note?: string): Promise<void> {
    if (!workOrder.bookingId) return;
    try {
      await this.bookings.cancel(workOrder.bookingId, actor, note ?? undefined);
    } catch (error) {
      this.logger.warn(
        `Khong dong duoc lich hen cua phieu ${workOrder.code}: ${(error as Error).message}`,
      );
    }
  }

  private async onDelivered(workOrder: WorkOrder, actor: Actor): Promise<void> {
    if (workOrder.bookingId) {
      try {
        await this.bookings.markDone(workOrder.bookingId, actor);
      } catch (error) {
        this.logger.warn(`Khong dong duoc lich hen cua phieu ${workOrder.code}`);
      }
    }
    /**
     * Khong gui SMS luc ban giao: khach dang dung ngay tai quay nhan xe, mot
     * tin nhan bao "xe da ban giao" khong them thong tin gi. Moc nay van
     * duoc ghi vao tien trinh de khach tra cuu lai sau.
     */
  }

  /**
   * AI-05 — de xuat ky bao duong tiep theo tu chu ky cua dich vu da lam.
   * Chi tao khi phieu co hang muc bao duong; du lieu nay la nguon cua FR-NOT-05.
   */
  private async scheduleNextMaintenance(workOrder: WorkOrder): Promise<void> {
    const months = this.settings.getNumber(
      SETTING_KEYS.MAINTENANCE_DEFAULT_INTERVAL_MONTHS,
      undefined,
      6,
    );
    const km = this.settings.getNumber(
      SETTING_KEYS.MAINTENANCE_DEFAULT_INTERVAL_KM,
      undefined,
      3000,
    );

    const base = workOrder.completedAt ?? new Date();
    const due = new Date(base);
    due.setMonth(due.getMonth() + months);

    await this.vehicles.upsertSchedule({
      vehicleId: workOrder.vehicleId,
      dueDate: due.toISOString().slice(0, 10),
      dueOdometer: workOrder.intakeOdometer + km,
    });
  }

  private async notifyCustomer(workOrder: WorkOrder, event: NotificationEvent): Promise<void> {
    try {
      const customer = await this.customers.findById(workOrder.customerId);
      if (!customer.notifySms) return;

      const bookingCode = workOrder.bookingId
        ? ((await this.bookings.findById(workOrder.bookingId)).code ?? '')
        : '';
      await this.notifications.send({
        event,
        channel: NotificationChannel.SMS,
        language: customer.language,
        recipient: customer.phone,
        customerId: customer.id,
        variables: {
          customerName: customer.name,
          bookingCode,
          vehicle: workOrder.vehicle
            ? [workOrder.vehicle.maker, workOrder.vehicle.model, workOrder.vehicle.plateNumber]
                .filter(Boolean)
                .join(' ')
            : '—',
          workOrderCode: workOrder.code,
          totalAmount: workOrder.totalAmount.toLocaleString('ja-JP'),
          completedAt: formatAppDateTime(workOrder.completedAt ?? new Date()),
        },
        // Phieu khong gan lich hen (khach vang lai den thang) thi khong co
        // trang tien do cong khai de dan toi.
        linkPath: bookingCode ? `/bookings/${bookingCode}/progress` : undefined,
        relatedType: 'WorkOrder',
        relatedId: workOrder.id,
      });
    } catch (error) {
      this.logger.error(`Khong gui duoc thong bao ${event} cho phieu ${workOrder.code}`);
    }
  }

  /** Ma phieu dang WO-yyyyMMdd-nnn, tang theo ngay. */
  private async nextCode(): Promise<string> {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.repo
      .createQueryBuilder('w')
      .where('w.code LIKE :prefix', { prefix: `WO-${today}-%` })
      .getCount();
    return `WO-${today}-${String(count + 1).padStart(3, '0')}`;
  }

  async markPaymentStatus(id: string, status: PaymentStatus, paidAmount: number): Promise<void> {
    await this.repo.update(id, { paymentStatus: status, paidAmount });
  }
}

/** Phieu co hang muc bao duong thi ghi lich su la bao duong, con lai la sua chua. */
function inferServiceType(workOrder: WorkOrder): ServiceType {
  const hasMaintenance = (workOrder.items ?? []).some(
    (item) => item.service?.type === ServiceType.MAINTENANCE,
  );
  return hasMaintenance ? ServiceType.MAINTENANCE : ServiceType.REPAIR;
}
