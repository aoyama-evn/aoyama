import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PaymentMethod } from 'src/common/enums';
import { WorkOrder } from 'src/modules/work-orders/entities/work-order.entity';

/**
 * Thanh toan tai cua hang — FR-PAY-02..05.
 * Giai doan dau khong co thanh toan truc tuyen (C-04), nen day chi la ban ghi
 * do nhan vien nhap tai SA-14. Mot phieu co the co nhieu lan thu (tra tung phan).
 */
@Entity('payments')
@Index(['workOrderId', 'createdAt'])
export class Payment extends BaseEntity {
  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
  method!: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamptz' })
  paidAt!: Date;

  @Column({ name: 'receipt_no', length: 64, nullable: true })
  receiptNo!: string | null;

  @Column({ name: 'received_by_id', type: 'uuid', nullable: true })
  receivedById!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** Ban ghi da huy — giu lai de doi soat thay vi xoa cung (FR-PAY-05). */
  @Column({ name: 'is_voided', default: false })
  isVoided!: boolean;

  @Column({ name: 'void_reason', type: 'text', nullable: true })
  voidReason!: string | null;
}
