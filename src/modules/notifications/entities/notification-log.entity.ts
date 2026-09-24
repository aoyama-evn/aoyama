import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import {
  Language,
  NotificationChannel,
  NotificationEvent,
  NotificationSendStatus,
} from 'src/common/enums';

/** Nhat ky gui thong bao — FR-NOT-12, FR-NOT-13, xem tai SA-42. */
@Entity('notification_logs')
@Index(['event', 'status', 'createdAt'])
@Index(['customerId', 'createdAt'])
export class NotificationLog extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Column({ type: 'enum', enum: NotificationEvent })
  event!: NotificationEvent;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ type: 'enum', enum: Language })
  language!: Language;

  /** So dien thoai hoac email nguoi nhan — che bot khi hien thi (NFR-SE-11). */
  @Column({ length: 128 })
  recipient!: string;

  @Column({ length: 255, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'enum', enum: NotificationSendStatus, default: NotificationSendStatus.QUEUED })
  status!: NotificationSendStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'retry_count', type: 'smallint', default: 0 })
  retryCount!: number;

  /** Ma tham chieu tu nha cung cap SMS/SMTP de doi soat chi phi (OQ-06). */
  @Column({ name: 'provider_message_id', length: 128, nullable: true })
  providerMessageId!: string | null;

  @Column({ name: 'related_type', length: 32, nullable: true })
  relatedType!: string | null;

  @Column({ name: 'related_id', type: 'uuid', nullable: true })
  relatedId!: string | null;
}
