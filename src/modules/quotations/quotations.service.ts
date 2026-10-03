import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import {
  NotificationChannel,
  NotificationEvent,
  QUOTATION_TRANSITIONS,
  QuotationStatus,
  WorkOrderStatus,
  QuotationReplyChannel,
} from 'src/common/enums';
import { applyTax, generatePublicToken, sumLines, yen } from 'src/common/utils';
import { CustomersService } from 'src/modules/customers/customers.service';
import { AdminNotificationsService } from 'src/modules/notifications/admin-notifications.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { WorkOrdersService } from 'src/modules/work-orders/work-orders.service';
import { CreateQuotationDto, RespondQuotationDto } from './dto/quotation.dto';
import { Quotation } from './entities/quotation.entity';
import { QuotationItem } from './entities/quotation-item.entity';

/** M-07 — Bao gia. SA-12, SA-13, SC-27, SC-28. */
@Injectable()
export class QuotationsService {
  private readonly logger = new Logger(QuotationsService.name);

  constructor(
    @InjectRepository(Quotation) private readonly repo: Repository<Quotation>,
    private readonly dataSource: DataSource,
    private readonly workOrders: WorkOrdersService,
    private readonly customers: CustomersService,
    private readonly notifications: NotificationsService,
    private readonly adminFeed: AdminNotificationsService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * SA-12 — lap bao gia. BR-34: tao ban moi thi ban truoc chuyen SUPERSEDED,
   * de lich su phan hoi cua khach van con nguyen.
   */
  async create(
    workOrderId: string,
    dto: CreateQuotationDto,
    createdById: string,
  ): Promise<Quotation> {
    const workOrder = await this.workOrders.findById(workOrderId);

    const latest = await this.repo.findOne({
      where: { workOrderId },
      order: { version: 'DESC' },
    });
    if (latest && latest.status === QuotationStatus.ACCEPTED) {
      throw new BadRequestException({
        code: 'QUOTATION_ALREADY_ACCEPTED',
        message: 'Bao gia da duoc khach dong y, khong lap ban moi duoc',
      });
    }

    const taxRate =
      dto.taxRate ?? this.settings.getNumber(SETTING_KEYS.TAX_RATE_PERCENT, undefined, 10);
    const totals = computeTotals(dto.items, dto.discountAmount ?? 0, taxRate);

    return this.dataSource.transaction(async (manager) => {
      if (latest && latest.status !== QuotationStatus.SUPERSEDED) {
        latest.status = QuotationStatus.SUPERSEDED;
        await manager.getRepository(Quotation).save(latest);
      }

      const version = (latest?.version ?? 0) + 1;
      const quotation = manager.getRepository(Quotation).create({
        code: `QT-${workOrder.code.replace('WO-', '')}-${String(version).padStart(2, '0')}`,
        workOrderId,
        customerId: workOrder.customerId,
        version,
        status: QuotationStatus.DRAFT,
        publicToken: generatePublicToken(),
        subtotal: totals.subtotal,
        discountAmount: dto.discountAmount ?? 0,
        taxRate,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        validUntil: dto.validUntil ?? null,
        depositAmount: dto.depositAmount ?? null,
        depositDueAt: dto.depositDueAt ? new Date(dto.depositDueAt) : null,
        note: dto.note ?? null,
        aiSuggestion: dto.aiSuggestion ?? null,
        createdById,
      });
      const saved = await manager.getRepository(Quotation).save(quotation);

      await manager.getRepository(QuotationItem).save(
        dto.items.map((item, index) =>
          manager.getRepository(QuotationItem).create({
            quotationId: saved.id,
            kind: item.kind ?? 'LABOR',
            serviceId: item.serviceId ?? null,
            partId: item.partId ?? null,
            name: item.name,
            description: item.description ?? null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: yen(item.unitPrice * item.quantity),
            isOptional: item.isOptional ?? false,
            suggestedByAi: item.suggestedByAi ?? false,
            sortOrder: index,
          }),
        ),
      );

      return saved;
    });
  }

  async findById(id: string): Promise<Quotation> {
    const quotation = await this.repo.findOne({
      where: { id },
      relations: { items: true, customer: true, workOrder: { vehicle: true, store: true } },
      order: { items: { sortOrder: 'ASC' } },
    });
    if (!quotation) {
      throw new NotFoundException({
        code: 'QUOTATION_NOT_FOUND',
        message: 'Khong tim thay bao gia',
      });
    }
    return quotation;
  }

  /** SC-27 — khach mo bang duong dan kho doan, khong can dang nhap (NFR-SE-08). */
  async findByPublicToken(token: string): Promise<Quotation> {
    const quotation = await this.repo.findOne({
      where: { publicToken: token },
      relations: { items: true, workOrder: { vehicle: true, store: true } },
      order: { items: { sortOrder: 'ASC' } },
    });
    if (!quotation) {
      throw new NotFoundException({
        code: 'QUOTATION_NOT_FOUND',
        message: 'Khong tim thay bao gia',
      });
    }
    if (quotation.status === QuotationStatus.DRAFT) {
      throw new NotFoundException({
        code: 'QUOTATION_NOT_SENT',
        message: 'Bao gia chua duoc gui',
      });
    }

    // Chi lay ma lich hen cho nut quay lai, khong keo theo ca ban ghi.
    const [row] = await this.dataSource.query<{ code: string }[]>(
      `select b.code from bookings b
         join work_orders w on w.booking_id = b.id
        where w.id = $1`,
      [quotation.workOrderId],
    );
    quotation.bookingCode = row?.code ?? null;

    return quotation;
  }

  async findByWorkOrder(workOrderId: string): Promise<Quotation[]> {
    return this.repo.find({
      where: { workOrderId },
      relations: { items: true },
      order: { version: 'DESC' },
    });
  }

  /** SA-13 — danh sach bao gia. */
  async search(
    query: PaginationQueryDto & { status?: QuotationStatus; keyword?: string; storeId?: string },
  ): Promise<PageDto<Quotation>> {
    const qb = this.repo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.customer', 'c')
      .leftJoinAndSelect('q.workOrder', 'w')
      .leftJoinAndSelect('w.vehicle', 'v');

    if (query.status) qb.andWhere('q.status = :status', { status: query.status });
    if (query.storeId) qb.andWhere('w.store_id = :storeId', { storeId: query.storeId });
    if (query.keyword) {
      qb.andWhere('(q.code ILIKE :kw OR c.name ILIKE :kw OR v.plate_number ILIKE :kw)', {
        kw: `%${query.keyword}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('q.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  /**
   * FR-QUO-06 — gui bao gia cho khach.
   * Phieu dich vu chuyen sang QUOTED de SA-09 loc duoc nhung phieu dang cho khach tra loi.
   */
  async send(id: string): Promise<Quotation> {
    const quotation = await this.assertTransition(id, QuotationStatus.SENT);

    quotation.status = QuotationStatus.SENT;
    quotation.sentAt = new Date();
    await this.repo.save(quotation);

    const workOrder = await this.workOrders.findById(quotation.workOrderId);
    if (workOrder.status === WorkOrderStatus.DIAGNOSING) {
      await this.workOrders.changeStatus(workOrder.id, WorkOrderStatus.QUOTED, {
        type: 'SYSTEM',
        id: null,
      });
    }

    await this.notifyCustomer(quotation);
    return this.findById(id);
  }

  /**
   * SC-28 — khach phan hoi bao gia. FR-QUO-08, FR-QUO-09.
   * Khach co the bo bot hang muc tuy chon; tong tien duoc tinh lai theo lua chon do.
   */
  async respond(token: string, dto: RespondQuotationDto): Promise<Quotation> {
    const quotation = await this.findByPublicToken(token);
    return this.applyReply(quotation, dto, QuotationReplyChannel.LINK, null);
  }

  /**
   * SA-12c — nhan vien ghi ho cau tra loi khi khach noi tai quay hoac qua
   * dien thoai.
   *
   * Khong phai khach nao cung bam duong dan trong tin nhan: nhieu nguoi goi
   * thang den cua hang. Truoc day nhan vien khong co cach nao ghi lai, ban
   * bao gia nam mai o trang thai "da gui" trong khi viec thuc te da chay
   * tiep. Ghi lai kenh va nguoi ghi de sau con doi chieu duoc — day la cau
   * tra loi do nhan vien thuat lai, khong phai khach tu bam.
   */
  async recordReply(
    id: string,
    dto: RespondQuotationDto,
    channel: QuotationReplyChannel,
    actorId: string | null,
  ): Promise<Quotation> {
    const quotation = await this.findById(id);
    return this.applyReply(quotation, dto, channel, actorId);
  }

  private async applyReply(
    quotation: Quotation,
    dto: RespondQuotationDto,
    channel: QuotationReplyChannel,
    actorId: string | null,
  ): Promise<Quotation> {

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException({
        code: 'QUOTATION_NOT_PENDING',
        message: 'Bao gia nay da duoc phan hoi truoc do',
      });
    }
    if (quotation.validUntil && quotation.validUntil < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException({
        code: 'QUOTATION_EXPIRED',
        message: 'Bao gia da qua han hieu luc, vui long lien he cua hang',
      });
    }

    await this.dataSource.transaction(async (manager) => {
      if (dto.accept) {
        // Hang muc bat buoc luon duoc giu; chi hang muc tuy chon moi bo duoc.
        const rejectedIds = new Set(dto.rejectedItemIds ?? []);
        for (const item of quotation.items) {
          const keep = !item.isOptional || !rejectedIds.has(item.id);
          if (item.isAccepted !== keep) {
            item.isAccepted = keep;
            await manager.getRepository(QuotationItem).save(item);
          }
        }

        const accepted = quotation.items.filter((i) => i.isAccepted);
        const totals = computeTotals(
          accepted.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity })),
          quotation.discountAmount,
          quotation.taxRate,
        );
        quotation.subtotal = totals.subtotal;
        quotation.taxAmount = totals.taxAmount;
        quotation.totalAmount = totals.totalAmount;
        quotation.status = QuotationStatus.ACCEPTED;
      } else {
        quotation.status = QuotationStatus.REJECTED;
        quotation.rejectReason = dto.reason ?? null;
        // Tu choi han va xin bao gia lai deu ve REJECTED, nhung viec cua
        // hang phai lam thi nguoc nhau — giu lai de nhan vien khong phai doan.
        quotation.revisionRequested = dto.requestRevision ?? false;
      }

      quotation.respondedAt = new Date();
      quotation.customerComment = dto.comment ?? null;
      quotation.respondedVia = channel;
      quotation.recordedById = actorId;
      await manager.getRepository(Quotation).save(quotation);
    });

    /**
     * Khach chot bao gia la tin hieu nhan vien cho: bat tay vao sua duoc roi.
     * Bao qua web, khong gui SMS — khach da biet chinh ho vua bam dong y.
     */
    if (dto.accept && channel === QuotationReplyChannel.LINK) {
      await this.adminFeed.push({
        event: NotificationEvent.QUOTATION_ACCEPTED,
        title: `Khach da chot bao gia ${quotation.code}`,
        body: `Tong ${quotation.totalAmount.toLocaleString('en-US')} JPY — co the bat dau sua xe.`,
        link: `/admin/work-orders/${quotation.workOrderId}`,
        storeId: quotation.workOrder?.storeId ?? null,
      });
    }

    // BR-33 — khach dong y thi phieu chuyen sang dang thuc hien.
    if (dto.accept) {
      const workOrder = await this.workOrders.findById(quotation.workOrderId);
      if (workOrder.status === WorkOrderStatus.QUOTED) {
        await this.workOrders.changeStatus(
          workOrder.id,
          WorkOrderStatus.IN_PROGRESS,
          actorId ? { type: 'ADMIN', id: actorId } : { type: 'CUSTOMER', id: quotation.customerId },
        );
      }
    }

    return this.findById(quotation.id);
  }

  async remove(id: string): Promise<void> {
    const quotation = await this.findById(id);
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException({
        code: 'QUOTATION_NOT_DRAFT',
        message: 'Chi xoa duoc bao gia con o trang thai nhap',
      });
    }
    await this.repo.delete(id);
  }

  /** SA-13 — dem bao gia dang cho khach tra loi, hien tren bang dieu khien. */
  async countPending(storeId?: string): Promise<number> {
    const qb = this.repo
      .createQueryBuilder('q')
      .leftJoin('q.workOrder', 'w')
      .where('q.status = :status', { status: QuotationStatus.SENT });
    if (storeId) qb.andWhere('w.store_id = :storeId', { storeId });
    return qb.getCount();
  }

  private async assertTransition(id: string, to: QuotationStatus): Promise<Quotation> {
    const quotation = await this.findById(id);
    const allowed = QUOTATION_TRANSITIONS[quotation.status];
    if (!allowed.includes(to)) {
      throw new BadRequestException({
        code: 'INVALID_STATUS_TRANSITION',
        message: `Khong the chuyen bao gia tu ${quotation.status} sang ${to}`,
        details: { from: quotation.status, to, allowed },
      });
    }
    return quotation;
  }

  private async notifyCustomer(quotation: Quotation): Promise<void> {
    try {
      const customer = await this.customers.findById(quotation.customerId);
      if (!quotation.bookingCode) {
        const [row] = await this.dataSource.query<{ code: string }[]>(
          `select b.code from bookings b
             join work_orders w on w.booking_id = b.id
            where w.id = $1`,
          [quotation.workOrderId],
        );
        quotation.bookingCode = row?.code ?? null;
      }
      if (!customer.notifySms) return;
      await this.notifications.send({
        event: NotificationEvent.QUOTATION_SENT,
        channel: NotificationChannel.SMS,
        language: customer.language,
        recipient: customer.phone,
        customerId: customer.id,
        variables: {
          customerName: customer.name,
          bookingCode: quotation.bookingCode ?? '',
          vehicle: vehicleLabel(quotation),
          quotationCode: quotation.code,
          totalAmount: quotation.totalAmount.toLocaleString('ja-JP'),
          quotationToken: quotation.publicToken,
        },
        // Dan thang vao ban bao gia, khong bat khach tu mo tien do roi tim.
        linkPath: `/quotations/${quotation.publicToken}`,
        relatedType: 'Quotation',
        relatedId: quotation.id,
      });
    } catch (error) {
      this.logger.error(`Khong gui duoc thong bao bao gia ${quotation.code}`);
    }
  }
}

/** "Honda Lead 29T1.122.12" — khach doc la biet tin nhan noi ve xe nao. */
function vehicleLabel(quotation: Quotation): string {
  const v = quotation.workOrder?.vehicle;
  if (!v) return '—';
  return [v.maker, v.model, v.plateNumber].filter(Boolean).join(' ');
}

function computeTotals(
  items: { unitPrice: number; quantity: number }[],
  discountAmount: number,
  taxRate: number,
) {
  const subtotal = sumLines(items);
  const beforeTax = Math.max(0, subtotal - discountAmount);
  const taxAmount = applyTax(beforeTax, taxRate);
  return { subtotal, taxAmount, totalAmount: yen(beforeTax + taxAmount) };
}
