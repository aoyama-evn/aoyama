import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Store } from './store.entity';

/** Gio lam viec theo thu trong tuan — FR-STO-03. 0 = Chu nhat. */
@Entity('store_business_hours')
@Index(['storeId', 'weekday'], { unique: true })
export class StoreBusinessHour extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (s) => s.businessHours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'smallint' })
  weekday!: number;

  @Column({ name: 'open_time', type: 'time', nullable: true })
  openTime!: string | null;

  @Column({ name: 'close_time', type: 'time', nullable: true })
  closeTime!: string | null;

  @Column({ name: 'is_closed', default: false })
  isClosed!: boolean;
}
