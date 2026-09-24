import { Column, Entity, Index, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { ServiceType } from 'src/common/enums';
import { I18nText } from 'src/common/types';
import { PriceRule } from './price-rule.entity';

/** Danh muc dich vu — FR-SVC-01..03, hien tai SC-02/SC-03 va SA-22/SA-23. */
@Entity('services')
export class Service extends SoftDeletableEntity {
  @Index({ unique: true })
  @Column({ length: 64 })
  slug!: string;

  @Column({ length: 32, unique: true })
  code!: string;

  @Column({ type: 'enum', enum: ServiceType })
  type!: ServiceType;

  @Column({ type: 'jsonb' })
  name!: I18nText;

  @Column({ name: 'short_description', type: 'jsonb', nullable: true })
  shortDescription!: I18nText | null;

  @Column({ type: 'jsonb', nullable: true })
  description!: I18nText | null;

  /** Danh sach hang muc kiem tra hien o SC-03 — mang I18nText. */
  @Column({ name: 'checklist_items', type: 'jsonb', default: () => "'[]'" })
  checklistItems!: I18nText[];

  @Column({ name: 'duration_minutes', type: 'int', default: 60 })
  durationMinutes!: number;

  /** Gia tham khao hien tren SC-04; gia chinh thuc tinh qua PriceRule. */
  @Column({ name: 'base_price', type: 'int', default: 0 })
  basePrice!: number;

  /** true khi dich vu chi bao gia rieng, vi du son va dong. */
  @Column({ name: 'quote_only', default: false })
  quoteOnly!: boolean;

  @Column({ name: 'icon_key', length: 32, nullable: true })
  iconKey!: string | null;

  @Column({ name: 'image_url', length: 512, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  /** Chu ky bao duong de xuat (thang) — nguon cho AI-05. */
  @Column({ name: 'maintenance_interval_months', type: 'int', nullable: true })
  maintenanceIntervalMonths!: number | null;

  @Column({ name: 'maintenance_interval_km', type: 'int', nullable: true })
  maintenanceIntervalKm!: number | null;

  @OneToMany(() => PriceRule, (r) => r.service)
  priceRules!: PriceRule[];
}
