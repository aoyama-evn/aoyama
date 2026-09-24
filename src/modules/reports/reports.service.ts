import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingStatus, PaymentStatus, WorkOrderStatus } from 'src/common/enums';
import { APP_TZ, formatAppDate } from 'src/common/utils';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Inventory } from 'src/modules/parts/entities/inventory.entity';
import { Payment } from 'src/modules/payments/entities/payment.entity';
import { WorkOrder } from 'src/modules/work-orders/entities/work-order.entity';
import { WorkOrderPart } from 'src/modules/work-orders/entities/work-order-part.entity';

export interface ReportRange {
  from: string;
  to: string;
  storeId?: string;
}

/** M-15 — Bao cao va thong ke. SA-02, SA-36, SA-37, SA-38. */
@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(WorkOrder) private readonly workOrderRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderPart) private readonly workOrderPartRepo: Repository<WorkOrderPart>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Inventory) private readonly inventoryRepo: Repository<Inventory>,
  ) {}

  /** SA-02 — so lieu nhanh tren bang dieu khien (FR-RPT-11). */
  async dashboard(storeId?: string) {
    const today = formatAppDate(new Date());

    const [
      todayBookings,
      pendingBookings,
      openWorkOrders,
      awaitingQuotation,
      unpaidWorkOrders,
      lowStockCount,
      todayRevenue,
    ] = await Promise.all([
      this.countBookingsOnDate(today, storeId),
      this.countBookings({ status: BookingStatus.PENDING, storeId }),
      this.countWorkOrders(
        [WorkOrderStatus.RECEIVED, WorkOrderStatus.DIAGNOSING, WorkOrderStatus.IN_PROGRESS],
        storeId,
      ),
      this.countWorkOrders([WorkOrderStatus.QUOTED], storeId),
      this.countUnpaidWorkOrders(storeId),
      this.countLowStock(storeId),
      this.sumRevenue({ from: today, to: today, storeId }),
    ]);

    return {
      date: today,
      todayBookings,
      pendingBookings,
      openWorkOrders,
      awaitingQuotation,
      unpaidWorkOrders,
      lowStockCount,
      todayRevenue,
    };
  }

  /** SA-36 — bao cao tong hop (FR-RPT-01..06). */
  async summary(range: ReportRange) {
    const [byStatus, byServiceType, byDay, revenue, workOrderStats] = await Promise.all([
      this.bookingsByStatus(range),
      this.bookingsByServiceType(range),
      this.bookingsByDay(range),
      this.sumRevenue(range),
      this.workOrderStats(range),
    ]);

    const total = byStatus.reduce((acc, row) => acc + row.count, 0);
    const cancelled = byStatus.find((r) => r.status === BookingStatus.CANCELLED)?.count ?? 0;
    const noShow = byStatus.find((r) => r.status === BookingStatus.NO_SHOW)?.count ?? 0;

    return {
      range,
      bookings: {
        total,
        byStatus,
        byServiceType,
        byDay,
        // FR-RPT-04 — ty le huy va ty le khach khong den.
        cancelRate: total > 0 ? Math.round((cancelled / total) * 1000) / 10 : 0,
        noShowRate: total > 0 ? Math.round((noShow / total) * 1000) / 10 : 0,
      },
      workOrders: workOrderStats,
      revenue,
    };
  }

  /** SA-37 — bao cao doanh thu (FR-RPT-06, FR-RPT-08..10). */
  async revenue(range: ReportRange) {
    const byDay = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('p.workOrder', 'w')
      .select(`CAST(p.paid_at AT TIME ZONE :tz AS date)`, 'date')
      .addSelect('SUM(p.amount)', 'amount')
      .addSelect('COUNT(DISTINCT p.work_order_id)', 'workOrders')
      .where('p.is_voided = false')
      .andWhere(`CAST(p.paid_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .setParameter('tz', APP_TZ)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; amount: string; workOrders: string }>();

    const byMethod = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('p.workOrder', 'w')
      .select('p.method', 'method')
      .addSelect('SUM(p.amount)', 'amount')
      .where('p.is_voided = false')
      .andWhere(`CAST(p.paid_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .groupBy('p.method')
      .getRawMany<{ method: string; amount: string }>();

    const splits = await this.workOrderRepo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.labor_subtotal), 0)', 'labor')
      .addSelect('COALESCE(SUM(w.parts_subtotal), 0)', 'parts')
      .where('w.status IN (:...statuses)', {
        statuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
      })
      .andWhere(`CAST(w.completed_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .getRawOne<{ labor: string; parts: string }>();

    const total = byDay.reduce((acc, r) => acc + Number(r.amount), 0);

    return {
      range,
      total,
      byDay: byDay.map((r) => ({
        date: r.date,
        amount: Number(r.amount),
        workOrders: Number(r.workOrders),
      })),
      byMethod: byMethod.map((r) => ({ method: r.method, amount: Number(r.amount) })),
      // FR-RPT-09 — tach doanh thu cong va doanh thu phu tung.
      split: {
        labor: Number(splits?.labor ?? 0),
        parts: Number(splits?.parts ?? 0),
      },
    };
  }

  /** SA-38 — bao cao phu tung va ton kho (FR-RPT-07). */
  async partsReport(range: ReportRange) {
    const topUsed = await this.workOrderPartRepo
      .createQueryBuilder('wp')
      .leftJoin('wp.workOrder', 'w')
      .select('wp.part_name', 'partName')
      .addSelect('wp.part_code', 'partCode')
      .addSelect('SUM(wp.quantity)', 'quantity')
      .addSelect('SUM(wp.quantity * wp.unit_price)', 'amount')
      .where('w.status IN (:...statuses)', {
        statuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
      })
      .andWhere(`CAST(w.completed_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .groupBy('wp.part_name')
      .addGroupBy('wp.part_code')
      .orderBy('quantity', 'DESC')
      .limit(20)
      .getRawMany<{ partName: string; partCode: string; quantity: string; amount: string }>();

    const lowStock = await this.inventoryRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.part', 'p')
      .leftJoinAndSelect('i.store', 's')
      .where('i.quantity <= i.min_quantity')
      .andWhere('i.min_quantity > 0')
      .andWhere(range.storeId ? 'i.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .orderBy('i.quantity', 'ASC')
      .getMany();

    return {
      range,
      topUsed: topUsed.map((r) => ({
        partName: r.partName,
        partCode: r.partCode,
        quantity: Number(r.quantity),
        amount: Number(r.amount),
      })),
      lowStock,
    };
  }

  // ---------------- Truy van don le ----------------

  private async bookingsByStatus(range: ReportRange) {
    const rows = await this.rangeQuery(range)
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.status')
      .getRawMany<{ status: BookingStatus; count: string }>();
    return rows.map((r) => ({ status: r.status, count: Number(r.count) }));
  }

  private async bookingsByServiceType(range: ReportRange) {
    const rows = await this.rangeQuery(range)
      .select('b.service_type', 'serviceType')
      .addSelect('COUNT(*)', 'count')
      .groupBy('b.service_type')
      .getRawMany<{ serviceType: string; count: string }>();
    return rows.map((r) => ({ serviceType: r.serviceType, count: Number(r.count) }));
  }

  private async bookingsByDay(range: ReportRange) {
    const rows = await this.rangeQuery(range)
      .select(`CAST(b.scheduled_at AT TIME ZONE :tz AS date)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .setParameter('tz', APP_TZ)
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany<{ date: string; count: string }>();
    return rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  private async workOrderStats(range: ReportRange) {
    const rows = await this.workOrderRepo
      .createQueryBuilder('w')
      .select('w.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(`CAST(w.created_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .groupBy('w.status')
      .getRawMany<{ status: string; count: string }>();

    // FR-RPT-05 — thoi gian trung binh tu tiep nhan den ban giao.
    const avg = await this.workOrderRepo
      .createQueryBuilder('w')
      .select('AVG(EXTRACT(EPOCH FROM (w.delivered_at - w.created_at)) / 3600)', 'hours')
      .where('w.delivered_at IS NOT NULL')
      .andWhere(`CAST(w.created_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .getRawOne<{ hours: string | null }>();

    return {
      byStatus: rows.map((r) => ({ status: r.status, count: Number(r.count) })),
      averageTurnaroundHours: avg?.hours ? Math.round(Number(avg.hours) * 10) / 10 : null,
    };
  }

  private async sumRevenue(range: ReportRange): Promise<number> {
    const row = await this.paymentRepo
      .createQueryBuilder('p')
      .leftJoin('p.workOrder', 'w')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.is_voided = false')
      .andWhere(`CAST(p.paid_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      })
      .andWhere(range.storeId ? 'w.store_id = :storeId' : '1=1', { storeId: range.storeId })
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private rangeQuery(range: ReportRange) {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where(`CAST(b.scheduled_at AT TIME ZONE :tz AS date) BETWEEN :from AND :to`, {
        tz: APP_TZ,
        from: range.from,
        to: range.to,
      });
    if (range.storeId) qb.andWhere('b.store_id = :storeId', { storeId: range.storeId });
    return qb;
  }

  private async countBookingsOnDate(date: string, storeId?: string): Promise<number> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where(`CAST(b.scheduled_at AT TIME ZONE :tz AS date) = :date`, { tz: APP_TZ, date })
      .andWhere('b.status != :cancelled', { cancelled: BookingStatus.CANCELLED });
    if (storeId) qb.andWhere('b.store_id = :storeId', { storeId });
    return qb.getCount();
  }

  private async countBookings(filter: {
    status: BookingStatus;
    storeId?: string;
  }): Promise<number> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: filter.status });
    if (filter.storeId) qb.andWhere('b.store_id = :storeId', { storeId: filter.storeId });
    return qb.getCount();
  }

  private async countWorkOrders(statuses: WorkOrderStatus[], storeId?: string): Promise<number> {
    const qb = this.workOrderRepo
      .createQueryBuilder('w')
      .where('w.status IN (:...statuses)', { statuses });
    if (storeId) qb.andWhere('w.store_id = :storeId', { storeId });
    return qb.getCount();
  }

  private async countUnpaidWorkOrders(storeId?: string): Promise<number> {
    const qb = this.workOrderRepo
      .createQueryBuilder('w')
      .where('w.payment_status != :paid', { paid: PaymentStatus.PAID })
      .andWhere('w.status IN (:...statuses)', {
        statuses: [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
      });
    if (storeId) qb.andWhere('w.store_id = :storeId', { storeId });
    return qb.getCount();
  }

  private async countLowStock(storeId?: string): Promise<number> {
    const qb = this.inventoryRepo
      .createQueryBuilder('i')
      .where('i.quantity <= i.min_quantity')
      .andWhere('i.min_quantity > 0');
    if (storeId) qb.andWhere('i.store_id = :storeId', { storeId });
    return qb.getCount();
  }
}
