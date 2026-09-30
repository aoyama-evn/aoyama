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

  /**
   * Giai doan nay anh duoc gui kem ngay trong yeu cau duoi dang data URL (xem
   * CP-14 AyImageUpload) nen mot anh dai hang chuc nghin ky tu. Gioi han 512
   * lam moi lan tiep nhan xe co anh deu do 500 "value too long". Cac bang anh
   * khac — bookings, vehicles, stores, parts — deu da khong gioi han do dai.
   */
  @Column({ type: 'text' })
  url!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption!: string | null;

  /** true khi anh duoc hien tren man theo doi tien do cua khach (SC-26). */
  @Column({ name: 'visible_to_customer', default: false })
  visibleToCustomer!: boolean;

  @Column({ name: 'uploaded_by_id', type: 'uuid', nullable: true })
  uploadedById!: string | null;
}
