import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { BookingServiceType, BookingStatus } from 'src/common/enums';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';
import { BookingService } from './booking-service.entity';
import { BookingStatusHistory } from './booking-status-history.entity';

/**
 * Lich hen — may trang thai RD-2026-001 muc 5.1.
 * Ma `code` la thu khach doc qua dien thoai va nhap o SC-20, nen phai de doc.
 */
@Entity('bookings')
@Index(['storeId', 'scheduledAt'])
@Index(['status', 'scheduledAt'])
export class Booking extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 16 })
  code!: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  /** null khi khach dat lich ma chua khai bao xe cu the — FR-BOOK-06. */
  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId!: string | null;

  @ManyToOne(() => Vehicle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle | null;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ name: 'service_type', type: 'enum', enum: BookingServiceType })
  serviceType!: BookingServiceType;

  /** Moc bat dau khung gio, luu UTC — hien thi quy doi ve UTC+9 (C-03). */
  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ name: 'slot_start_time', type: 'time' })
  slotStartTime!: string;

  @Column({ name: 'slot_end_time', type: 'time' })
  slotEndTime!: string;

  /** Anh chup thong tin khach tai thoi diem dat — ho so co the doi ve sau. */
  @Column({ name: 'contact_name', length: 128 })
  contactName!: string;

  @Column({ name: 'contact_phone', length: 20 })
  contactPhone!: string;

  @Column({ type: 'varchar', name: 'contact_email', length: 128, nullable: true })
  contactEmail!: string | null;

  /** Mo ta trieu chung khach tu nhap o SC-14. */
  @Column({ name: 'symptom_description', type: 'text', nullable: true })
  symptomDescription!: string | null;

  @Column({ name: 'symptom_photo_urls', type: 'jsonb', default: () => "'[]'" })
  symptomPhotoUrls!: string[];

  /** SC-12 cho khach gui kem mot doan video ngan ve tinh trang xe. */
  @Column({ name: 'symptom_video_url', type: 'text', nullable: true })
  symptomVideoUrl!: string | null;

  /** Phien chan doan AI da dan sang luong dat lich — AI-01. */
  @Column({ name: 'ai_diagnosis_id', type: 'uuid', nullable: true })
  aiDiagnosisId!: string | null;

  /** true khi lich do Admin dat thay khach tai SA-06 — BR-12. */
  @Column({ name: 'created_by_admin', default: false })
  createdByAdmin!: boolean;

  @Column({ name: 'created_by_admin_id', type: 'uuid', nullable: true })
  createdByAdminId!: string | null;

  /** Lich sinh tu chuc nang dat lai lich bao duong — FR-BOOK-17, BR-11. */
  @Column({ name: 'rebooked_from_id', type: 'uuid', nullable: true })
  rebookedFromId!: string | null;

  // ---- Ma QR (FR-QR-01..03) ----
  @Column({ type: 'varchar', name: 'qr_token', length: 64, nullable: true, unique: true })
  qrToken!: string | null;

  @Column({ name: 'qr_issued_at', type: 'timestamptz', nullable: true })
  qrIssuedAt!: Date | null;

  @Column({ name: 'qr_used_at', type: 'timestamptz', nullable: true })
  qrUsedAt!: Date | null;

  // ---- Moc thoi gian theo trang thai ----
  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: true })
  receivedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason!: string | null;

  /** CUSTOMER hoac ADMIN — de thong ke ty le huy theo nguon (FR-RPT-04). */
  @Column({ type: 'varchar', name: 'cancelled_by', length: 16, nullable: true })
  cancelledBy!: string | null;

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt!: Date | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote!: string | null;

  @OneToMany(() => BookingService, (s) => s.booking, { cascade: true })
  services!: BookingService[];

  @OneToMany(() => BookingStatusHistory, (h) => h.booking)
  statusHistories!: BookingStatusHistory[];
}
