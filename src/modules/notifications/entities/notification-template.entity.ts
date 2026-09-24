import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Language, NotificationChannel, NotificationEvent } from 'src/common/enums';

/**
 * Mau thong bao — FR-NOT-09..11, quan ly tai SA-41.
 * Mot mau cho moi to hop (su kien, kenh, ngon ngu).
 */
@Entity('notification_templates')
@Index(['event', 'channel', 'language'], { unique: true })
export class NotificationTemplate extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationEvent })
  event!: NotificationEvent;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel!: NotificationChannel;

  @Column({ type: 'enum', enum: Language })
  language!: Language;

  /** Chi dung cho kenh EMAIL. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  subject!: string | null;

  /** Noi dung co bien dang {{bookingCode}}, {{storeName}}, {{scheduledAt}}. */
  @Column({ type: 'text' })
  body!: string;

  /** Danh sach bien duoc phep — hien o SA-41 de nguoi soan biet cho nhap gi. */
  @Column({ name: 'available_variables', type: 'jsonb', default: () => "'[]'" })
  availableVariables!: string[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'updated_by_id', type: 'uuid', nullable: true })
  updatedById!: string | null;
}
