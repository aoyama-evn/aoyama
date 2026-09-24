import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Store } from 'src/modules/stores/entities/store.entity';
import { Part } from './part.entity';

/** Ton kho theo tung cua hang — FR-PRT-09, FR-PRT-12. */
@Entity('inventories')
@Index(['storeId', 'partId'], { unique: true })
export class Inventory extends BaseEntity {
  @Column({ name: 'store_id', type: 'uuid' })
  storeId!: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store!: Store;

  @Column({ name: 'part_id', type: 'uuid' })
  partId!: string;

  @ManyToOne(() => Part, (p) => p.inventories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'part_id' })
  part!: Part;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  /** Nguong canh bao sap het — FR-PRT-12. */
  @Column({ name: 'min_quantity', type: 'int', default: 0 })
  minQuantity!: number;

  @Column({ name: 'location_note', length: 128, nullable: true })
  locationNote!: string | null;
}
