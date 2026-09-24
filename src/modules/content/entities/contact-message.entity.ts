import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Language } from 'src/common/enums';

/** Lien he tu SC-08 — FR-PUB-07. */
@Entity('contact_messages')
@Index(['isHandled', 'createdAt'])
export class ContactMessage extends BaseEntity {
  @Column({ length: 128 })
  name!: string;

  @Column({ length: 20, nullable: true })
  phone!: string | null;

  @Column({ length: 128, nullable: true })
  email!: string | null;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId!: string | null;

  @Column({ length: 255, nullable: true })
  subject!: string | null;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'enum', enum: Language, default: Language.JA })
  language!: Language;

  @Column({ name: 'is_handled', default: false })
  isHandled!: boolean;

  @Column({ name: 'handled_by_id', type: 'uuid', nullable: true })
  handledById!: string | null;

  @Column({ name: 'handled_at', type: 'timestamptz', nullable: true })
  handledAt!: Date | null;

  @Column({ name: 'handler_note', type: 'text', nullable: true })
  handlerNote!: string | null;
}
