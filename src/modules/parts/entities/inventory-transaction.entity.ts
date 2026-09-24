import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { InventoryTxType } from 'src/common/enums';
import { Store } from 'src/modules/stores/entities/store.entity';
import { Part } from './part.entity';

/**
 * Bien dong ton kho — FR-PRT-11, BR-42.
 * Ban ghi chi ghi them; ton kho hien tai suy ra tu tong bien dong.
 */
@Entity('inventory_transactions')
@Index(['storeId', 'partId', 'createdAt'])
export class InventoryTransaction extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ name: 'part_id', type: 'uuid' })
  partId!: string;

  @ManyToOne(() => Part, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'part_id' })
  part!: Part;

  @Column({ type: 'enum', enum: InventoryTxType })
  type!: InventoryTxType;

  /** Duong khi nhap, am khi xuat — de tong hop bang mot phep SUM. */
  @Column({ name: 'quantity_change', type: 'int' })
  quantityChange!: number;

  @Column({ name: 'quantity_after', type: 'int' })
  quantityAfter!: number;

  @Column({ name: 'unit_cost', type: 'int', nullable: true })
  unitCost!: number | null;

  /** Phieu dich vu lam phat sinh bien dong (khi type = OUT hoac RETURN). */
  @Column({ name: 'work_order_id', type: 'uuid', nullable: true })
  workOrderId!: string | null;

  @Column({ name: 'performed_by_id', type: 'uuid', nullable: true })
  performedById!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;
}
