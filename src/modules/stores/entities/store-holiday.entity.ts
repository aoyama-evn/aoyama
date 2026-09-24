import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Store } from './store.entity';

/** Ngay nghi le / nghi dot xuat — FR-STO-04, BR-09. */
@Entity('store_holidays')
@Index(['storeId', 'date'], { unique: true })
export class StoreHoliday extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (s) => s.holidays, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason!: string | null;
}
