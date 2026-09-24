import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Store } from './store.entity';

/**
 * Khung gio nhan xe — FR-STO-05, FR-STO-07.
 * capacity = so luot xe toi da cua hang nhan trong khung gio nay (BR-07).
 */
@Entity('time_slots')
@Index(['storeId', 'weekday', 'startTime'], { unique: true })
export class TimeSlot extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, (s) => s.timeSlots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ type: 'smallint' })
  weekday!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ type: 'int', default: 3 })
  capacity!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
