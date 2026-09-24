import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod, PaymentStatus } from 'src/common/enums';
import { WorkOrdersService } from 'src/modules/work-orders/work-orders.service';
import { Payment } from './entities/payment.entity';

/**
 * M-13 — Thanh toan. SA-14, SC-32.
 * Giai doan dau chi thanh toan tai cua hang (C-04), nen module nay ghi nhan
 * chu khong xu ly giao dich.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private readonly repo: Repository<Payment>,
    private readonly workOrders: WorkOrdersService,
  ) {}

  async listByWorkOrder(workOrderId: string): Promise<Payment[]> {
    return this.repo.find({
      where: { workOrderId },
      order: { paidAt: 'ASC' },
    });
  }

  /**
   * FR-PAY-02..04 — ghi nhan mot lan thu tien.
   * Trang thai thanh toan cua phieu duoc tinh lai tu tong da thu, khong nhap tay,
   * de so lieu bao cao doanh thu luon khop voi cac dong thu.
   */
  async record(
    workOrderId: string,
    input: {
      amount: number;
      method: PaymentMethod;
      paidAt?: string;
      receiptNo?: string;
      note?: string;
    },
    receivedById: string,
  ): Promise<Payment> {
    const workOrder = await this.workOrders.findById(workOrderId);

    if (input.amount <= 0) {
      throw new BadRequestException({
        code: 'INVALID_AMOUNT',
        message: 'So tien phai lon hon 0',
      });
    }

    const alreadyPaid = await this.sumPaid(workOrderId);
    // BR-40 — khong thu vuot tong tien cua phieu.
    if (alreadyPaid + input.amount > workOrder.totalAmount) {
      throw new BadRequestException({
        code: 'PAYMENT_EXCEEDS_TOTAL',
        message: 'So tien thu vuot qua tong tien cua phieu',
        details: { total: workOrder.totalAmount, alreadyPaid, attempting: input.amount },
      });
    }

    const payment = await this.repo.save(
      this.repo.create({
        workOrderId,
        amount: input.amount,
        method: input.method,
        paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
        receiptNo: input.receiptNo ?? null,
        note: input.note ?? null,
        receivedById,
      }),
    );

    await this.syncWorkOrderStatus(workOrderId, workOrder.totalAmount);
    return payment;
  }

  /** FR-PAY-05 — huy mot dong thu nham; giu ban ghi de doi soat. */
  async voidPayment(paymentId: string, reason: string): Promise<Payment> {
    const payment = await this.repo.findOneOrFail({ where: { id: paymentId } });
    if (payment.isVoided) return payment;

    payment.isVoided = true;
    payment.voidReason = reason;
    await this.repo.save(payment);

    const workOrder = await this.workOrders.findById(payment.workOrderId);
    await this.syncWorkOrderStatus(payment.workOrderId, workOrder.totalAmount);
    return payment;
  }

  async sumPaid(workOrderId: string): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.work_order_id = :workOrderId', { workOrderId })
      .andWhere('p.is_voided = false')
      .getRawOne<{ total: string }>();
    return Number(row?.total ?? 0);
  }

  private async syncWorkOrderStatus(workOrderId: string, totalAmount: number): Promise<void> {
    const paid = await this.sumPaid(workOrderId);
    let status = PaymentStatus.UNPAID;
    if (paid > 0 && paid < totalAmount) status = PaymentStatus.PARTIAL;
    if (paid >= totalAmount && totalAmount > 0) status = PaymentStatus.PAID;
    await this.workOrders.markPaymentStatus(workOrderId, status, paid);
  }
}
