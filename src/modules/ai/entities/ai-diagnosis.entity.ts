import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Language } from 'src/common/enums';

/** Mot loi nghi ngo kem muc do khop — AI-01, FR-AI-06. */
export interface DiagnosisFinding {
  /** Ten loi nghi ngo, da dich theo ngon ngu phien. */
  label: string;
  /** Muc do khop 0..100 — hien thi kem nhan "Goi y boi AI" (RK-01). */
  matchPercent: number;
  description?: string;
  /** Ma dich vu de xuat, dan thang sang SC-12. */
  suggestedServiceCodes?: string[];
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DiagnosisMessage {
  role: 'user' | 'assistant';
  text?: string;
  imageUrls?: string[];
  audioUrl?: string;
  /** Van ban do he thong chuyen tu ghi am — FR-AI-04. */
  transcript?: string;
  at: string;
}

/**
 * Phien chan doan AI — AI-01, luu tai SC-10/SC-11 va doc lai o SA-05, SA-08.
 * Anh va ghi am chi dung cho phien tuong ung va co han luu tru (RK-07).
 */
@Entity('ai_diagnoses')
@Index(['createdAt'])
export class AiDiagnosis extends BaseEntity {
  /** Khach chua dinh danh van tao duoc phien — gan customerId khi dat lich. */
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ name: 'session_key', length: 64 })
  sessionKey!: string;

  @Column({ type: 'enum', enum: Language, default: Language.JA })
  language!: Language;

  @Column({ type: 'varchar', name: 'vehicle_maker', length: 64, nullable: true })
  vehicleMaker!: string | null;

  @Column({ type: 'varchar', name: 'vehicle_model', length: 64, nullable: true })
  vehicleModel!: string | null;

  @Column({ type: 'int', name: 'vehicle_year', nullable: true })
  vehicleYear!: number | null;

  /**
   * Mot hoac nhieu y dinh khach chon o dau phien, ngan cach bang dau phay:
   * MAINTENANCE, REPAIR, INSPECTION. Khach chon duoc nhieu muc cung luc nen
   * cot phai du cho ca ba.
   */
  @Column({ type: 'varchar', name: 'service_intent', length: 64, nullable: true })
  serviceIntent!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  messages!: DiagnosisMessage[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  findings!: DiagnosisFinding[];

  @Column({ name: 'summary_text', type: 'text', nullable: true })
  summaryText!: string | null;

  /** PENDING | COMPLETED | FAILED — FAILED khi dich vu AI khong phan hoi. */
  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: string;

  @Column({ type: 'varchar', name: 'model_name', length: 64, nullable: true })
  modelName!: string | null;

  @Column({ name: 'latency_ms', type: 'int', nullable: true })
  latencyMs!: number | null;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId!: string | null;

  /** Han xoa tep dinh kem — tien trinh nen don theo cot nay (RK-07). */
  @Column({ name: 'media_expires_at', type: 'timestamptz', nullable: true })
  mediaExpiresAt!: Date | null;
}
