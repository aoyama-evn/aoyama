import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Service } from './service.entity';

/**
 * Quy tac gia — FR-SVC-04, FR-SVC-05, BR-36..BR-38.
 * Ap dung theo phan khuc dung tich xe va tuy chon cua hang;
 * khi nhieu dong cung khop thi dong hep nhat thang.
 */
@Entity('price_rules')
export class PriceRule extends BaseEntity {
  @Column({ name: 'service_id', type: 'uuid' })
  serviceId!: string;

  @ManyToOne(() => Service, (s) => s.priceRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service!: Service;

  /** null = ap dung cho moi cua hang. */
  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId!: string | null;

  @Column({ name: 'engine_cc_from', type: 'int', nullable: true })
  engineCcFrom!: number | null;

  @Column({ name: 'engine_cc_to', type: 'int', nullable: true })
  engineCcTo!: number | null;

  /** Muc do kho: 1 = tieu chuan, 2 = trung binh, 3 = phuc tap. */
  @Column({ name: 'difficulty_level', type: 'smallint', default: 1 })
  difficultyLevel!: number;

  @Column({ type: 'int' })
  price!: number;

  @Column({ name: 'labor_minutes', type: 'int', nullable: true })
  laborMinutes!: number | null;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom!: string | null;

  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  note!: string | null;
}
