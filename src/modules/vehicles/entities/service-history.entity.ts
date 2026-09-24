import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { ServiceType } from 'src/common/enums';
import { Vehicle } from './vehicle.entity';

/**
 * Lich su dich vu cua xe — FR-VEH-04..06.
 * Sinh tu dong khi phieu dich vu chuyen sang COMPLETED (BR-30).
 */
@Entity('service_histories')
@Index(['vehicleId', 'servicedAt'])
export class ServiceHistory extends BaseEntity {
  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, (v) => v.serviceHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ name: 'work_order_id', type: 'uuid', nullable: true })
  workOrderId!: string | null;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @Column({ name: 'serviced_at', type: 'timestamptz' })
  servicedAt!: Date;

  @Column({ type: 'enum', enum: ServiceType })
  type!: ServiceType;

  @Column({ length: 255 })
  summary!: string;

  @Column({ type: 'text', nullable: true })
  detail!: string | null;

  @Column({ type: 'int', nullable: true })
  odometer!: number | null;

  @Column({ name: 'total_amount', type: 'int', default: 0 })
  totalAmount!: number;

  @Column({ name: 'item_names', type: 'jsonb', default: () => "'[]'" })
  itemNames!: string[];
}
