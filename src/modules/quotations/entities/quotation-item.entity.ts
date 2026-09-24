import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Quotation } from './quotation.entity';

/** Dong bao gia — FR-QUO-02. Phan loai LABOR (cong) hoac PART (phu tung). */
@Entity('quotation_items')
export class QuotationItem extends BaseEntity {
  @Column({ name: 'quotation_id', type: 'uuid' })
  quotationId!: string;

  @ManyToOne(() => Quotation, (q) => q.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quotation_id' })
  quotation!: Quotation;

  /** LABOR | PART | OTHER */
  @Column({ length: 16, default: 'LABOR' })
  kind!: string;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @Column({ name: 'part_id', type: 'uuid', nullable: true })
  partId!: string | null;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'unit_price', type: 'int', default: 0 })
  unitPrice!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'line_total', type: 'int', default: 0 })
  lineTotal!: number;

  /** Hang muc tuy chon — khach co the bo khi phan hoi bao gia (FR-QUO-08). */
  @Column({ name: 'is_optional', default: false })
  isOptional!: boolean;

  @Column({ name: 'is_accepted', default: true })
  isAccepted!: boolean;

  @Column({ name: 'suggested_by_ai', default: false })
  suggestedByAi!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
