import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Part } from 'src/modules/parts/entities/part.entity';
import { WorkOrder } from './work-order.entity';

/** Phu tung su dung trong phieu — tru kho khi phieu chuyen COMPLETED (BR-42). */
@Entity('work_order_parts')
export class WorkOrderPart extends BaseEntity {
  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (w) => w.parts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ name: 'part_id', type: 'uuid', nullable: true })
  partId!: string | null;

  @ManyToOne(() => Part, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'part_id' })
  part!: Part | null;

  /** Chup lai ten va gia ban tai thoi diem dung — lich su khong doi theo bang gia. */
  @Column({ name: 'part_name', length: 255 })
  partName!: string;

  @Column({ name: 'part_code', length: 64, nullable: true })
  partCode!: string | null;

  @Column({ name: 'unit_price', type: 'int', default: 0 })
  unitPrice!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ name: 'suggested_by_ai', default: false })
  suggestedByAi!: boolean;
}
