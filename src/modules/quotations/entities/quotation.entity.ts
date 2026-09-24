import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { QuotationStatus } from 'src/common/enums';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { WorkOrder } from 'src/modules/work-orders/entities/work-order.entity';
import { QuotationItem } from './quotation-item.entity';

/**
 * Bao gia — may trang thai RD-2026-001 muc 5.3.
 * `publicToken` la duong dan kho doan khach mo duoc ma khong can dang nhap (NFR-SE-08).
 */
@Entity('quotations')
@Index(['workOrderId', 'version'], { unique: true })
export class Quotation extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 24 })
  code!: string;

  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  /** Tang dan moi lan lap ban moi; ban cu chuyen SUPERSEDED (BR-34). */
  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'enum', enum: QuotationStatus, default: QuotationStatus.DRAFT })
  status!: QuotationStatus;

  @Index({ unique: true })
  @Column({ name: 'public_token', length: 64 })
  publicToken!: string;

  @Column({ type: 'int', default: 0 })
  subtotal!: number;

  @Column({ name: 'discount_amount', type: 'int', default: 0 })
  discountAmount!: number;

  @Column({ name: 'tax_rate', type: 'smallint', default: 10 })
  taxRate!: number;

  @Column({ name: 'tax_amount', type: 'int', default: 0 })
  taxAmount!: number;

  @Column({ name: 'total_amount', type: 'int', default: 0 })
  totalAmount!: number;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** Ghi lai goi y AI-02 truoc khi Admin sua — de doi chieu do chinh xac. */
  @Column({ name: 'ai_suggestion', type: 'jsonb', nullable: true })
  aiSuggestion!: Record<string, unknown> | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'responded_at', type: 'timestamptz', nullable: true })
  respondedAt!: Date | null;

  /** Ly do khach tu choi — FR-QUO-09, dung cho SA-13. */
  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason!: string | null;

  /** Hang muc khach chon rieng khi dong y mot phan. */
  @Column({ name: 'customer_comment', type: 'text', nullable: true })
  customerComment!: string | null;

  @OneToMany(() => QuotationItem, (i) => i.quotation, { cascade: true })
  items!: QuotationItem[];
}
