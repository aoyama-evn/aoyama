import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { WorkItemState } from 'src/common/enums';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Service } from 'src/modules/catalog/entities/service.entity';
import { WorkOrder } from './work-order.entity';

/**
 * Hang muc cong viec — FR-WO-05. Tham chieu Service hoac nhap tu do
 * (serviceId = null) cho viec phat sinh khong co trong danh muc.
 */
@Entity('work_order_items')
export class WorkOrderItem extends BaseEntity {
  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (w) => w.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @ManyToOne(() => Service, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service | null;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'unit_price', type: 'int', default: 0 })
  unitPrice!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'labor_minutes', type: 'int', nullable: true })
  laborMinutes!: number | null;

  /** Danh dau hang muc do AI goi y — AI-02, luon can nguoi duyet. */
  @Column({ name: 'suggested_by_ai', default: false })
  suggestedByAi!: boolean;

  /**
   * Thay cho co is_done cu. Hai trang thai khong du: khach nhin "chua xong"
   * thi khong biet xe minh da duoc dong vao chua.
   */
  @Column({ type: 'enum', enum: WorkItemState, default: WorkItemState.PENDING })
  state!: WorkItemState;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;
}
