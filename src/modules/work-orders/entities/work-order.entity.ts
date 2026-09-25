import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { PaymentStatus, WorkDifficulty, WorkOrderStatus } from 'src/common/enums';
import { AdminUser } from 'src/modules/admin-users/entities/admin-user.entity';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';
import { WorkOrderItem } from './work-order-item.entity';
import { WorkOrderPart } from './work-order-part.entity';
import { WorkOrderPhoto } from './work-order-photo.entity';
import { WorkOrderStatusHistory } from './work-order-status-history.entity';

/**
 * Phieu dich vu — may trang thai RD-2026-001 muc 5.2.
 * Mo khi xe duoc tiep nhan tai SA-08; dong khi ban giao xe.
 */
@Entity('work_orders')
@Index(['storeId', 'status'])
@Index(['status', 'createdAt'])
export class WorkOrder extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 24 })
  code!: string;

  /** null khi xe vao xuong khong qua dat lich (khach den truc tiep). */
  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId!: string | null;

  @ManyToOne(() => Booking, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking | null;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'enum', enum: WorkOrderStatus, default: WorkOrderStatus.RECEIVED })
  status!: WorkOrderStatus;

  /** Truong rieng, doc lap voi trang thai phieu (RD muc 5.2). */
  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus!: PaymentStatus;

  // ---- Hien trang xe khi tiep nhan (FR-WO-03, bat buoc theo BR-18) ----
  @Column({ name: 'intake_odometer', type: 'int' })
  intakeOdometer!: number;

  /** Muc nhien lieu 0..100 phan tram. */
  /** Muc nhien lieu theo phan tu binh: 0..4 (SA-08 ghi dang "1/2"). */
  @Column({ name: 'intake_fuel_level', type: 'smallint', nullable: true })
  intakeFuelLevel!: number | null;

  /** SA-08 — phu kien khach de lai cung xe, ghi rieng de doi chieu khi ban giao. */
  @Column({ name: 'intake_accessories', type: 'varchar', length: 255, nullable: true })
  intakeAccessories!: string | null;

  @Column({ name: 'intake_note', type: 'text', nullable: true })
  intakeNote!: string | null;

  @Column({ name: 'customer_symptom', type: 'text', nullable: true })
  customerSymptom!: string | null;

  // ---- Chan doan (FR-WO-04..06, SA-11) ----
  @Column({ name: 'diagnosis_note', type: 'text', nullable: true })
  diagnosisNote!: string | null;

  @Column({ name: 'diagnosis_cause', type: 'text', nullable: true })
  diagnosisCause!: string | null;

  @Column({ name: 'assigned_technician_id', type: 'uuid', nullable: true })
  assignedTechnicianId!: string | null;

  @ManyToOne(() => AdminUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_technician_id' })
  assignedTechnician!: AdminUser | null;

  /** SA-10a — muc do kho do ky thuat vien danh gia. */
  @Column({ type: 'enum', enum: WorkDifficulty, nullable: true })
  difficulty!: WorkDifficulty | null;

  @Column({ name: 'received_by_id', type: 'uuid', nullable: true })
  receivedById!: string | null;

  // ---- Tien do hien cho khach o SC-26 (FR-WO-09, FR-WO-10) ----
  @Column({ name: 'progress_percent', type: 'smallint', default: 0 })
  progressPercent!: number;

  @Column({ name: 'progress_note', type: 'text', nullable: true })
  progressNote!: string | null;

  @Column({ name: 'estimated_completion_at', type: 'timestamptz', nullable: true })
  estimatedCompletionAt!: Date | null;

  // ---- Tong tien (BR-38) ----
  @Column({ name: 'labor_subtotal', type: 'int', default: 0 })
  laborSubtotal!: number;

  @Column({ name: 'parts_subtotal', type: 'int', default: 0 })
  partsSubtotal!: number;

  @Column({ name: 'discount_amount', type: 'int', default: 0 })
  discountAmount!: number;

  @Column({ name: 'tax_rate', type: 'smallint', default: 10 })
  taxRate!: number;

  @Column({ name: 'tax_amount', type: 'int', default: 0 })
  taxAmount!: number;

  @Column({ name: 'total_amount', type: 'int', default: 0 })
  totalAmount!: number;

  @Column({ name: 'paid_amount', type: 'int', default: 0 })
  paidAmount!: number;

  // ---- Moc thoi gian ----
  @Column({ name: 'diagnosing_at', type: 'timestamptz', nullable: true })
  diagnosingAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason!: string | null;

  /** true khi da tru kho phu tung — chan tru hai lan (BR-42). */
  @Column({ name: 'stock_deducted', default: false })
  stockDeducted!: boolean;

  @OneToMany(() => WorkOrderItem, (i) => i.workOrder, { cascade: true })
  items!: WorkOrderItem[];

  @OneToMany(() => WorkOrderPart, (p) => p.workOrder, { cascade: true })
  parts!: WorkOrderPart[];

  @OneToMany(() => WorkOrderPhoto, (p) => p.workOrder, { cascade: true })
  photos!: WorkOrderPhoto[];

  @OneToMany(() => WorkOrderStatusHistory, (h) => h.workOrder)
  statusHistories!: WorkOrderStatusHistory[];
}
