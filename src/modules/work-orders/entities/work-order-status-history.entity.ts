import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { WorkOrderStatus } from 'src/common/enums';
import { WorkOrder } from './work-order.entity';

/** Nhat ky chuyen trang thai phieu — nguon cho dong thoi gian tai SA-10 va SC-26. */
@Entity('work_order_status_histories')
@Index(['workOrderId', 'createdAt'])
export class WorkOrderStatusHistory extends BaseEntity {
  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (w) => w.statusHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'from_status', type: 'enum', enum: WorkOrderStatus, nullable: true })
  fromStatus!: WorkOrderStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: WorkOrderStatus })
  toStatus!: WorkOrderStatus;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  /** true khi moc nay duoc hien tren man theo doi tien do cua khach. */
  @Column({ name: 'visible_to_customer', default: true })
  visibleToCustomer!: boolean;
}
