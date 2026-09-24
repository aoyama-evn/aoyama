import { Column, Entity } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { I18nText } from 'src/common/types';

/** Cau hoi thuong gap — FR-PUB-06, hien tai SC-07. */
@Entity('faqs')
export class Faq extends SoftDeletableEntity {
  @Column({ type: 'jsonb' })
  question!: I18nText;

  @Column({ type: 'jsonb' })
  answer!: I18nText;

  @Column({ type: 'varchar', length: 64, nullable: true })
  category!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
