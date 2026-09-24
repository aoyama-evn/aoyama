import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { WorkOrder } from './work-order.entity';

/**
 * Anh hien trang xe — FR-WO-03 (khi tiep nhan), FR-WO-08 (trong qua trinh lam),
 * FR-WO-14 (khi ban giao). Giai doan quyet dinh nhom anh nao hien cho khach.
 */
@Entity('work_order_photos')
export class WorkOrderPhoto extends BaseEntity {
  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => WorkOrder, (w) => w.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  /** INTAKE | PROGRESS | COMPLETION */
  @Column({ length: 16 })
  stage!: string;

  @Column({ length: 512 })
  url!: string;

  @Column({ length: 255, nullable: true })
  caption!: string | null;

  /** true khi anh duoc hien tren man theo doi tien do cua khach (SC-26). */
  @Column({ name: 'visible_to_customer', default: false })
  visibleToCustomer!: boolean;

  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById!: string | null;
}
