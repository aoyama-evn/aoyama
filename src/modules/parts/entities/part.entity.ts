import { Column, Entity, Index, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { I18nText } from 'src/common/types';
import { Inventory } from './inventory.entity';

/** Phu tung — FR-PRT-01..03. Co the tao bang AI tu anh (AI-04, SA-27). */
@Entity('parts')
export class Part extends SoftDeletableEntity {
  @Index({ unique: true })
  @Column({ length: 64 })
  code!: string;

  @Column({ type: 'jsonb' })
  name!: I18nText;

  @Column({ length: 128, nullable: true })
  maker!: string | null;

  @Column({ name: 'maker_part_no', length: 64, nullable: true })
  makerPartNo!: string | null;

  @Column({ length: 64, nullable: true })
  category!: string | null;

  @Column({ length: 128, nullable: true })
  specification!: string | null;

  @Column({ length: 16, default: 'pcs' })
  unit!: string;

  @Column({ name: 'cost_price', type: 'int', default: 0 })
  costPrice!: number;

  @Column({ name: 'sell_price', type: 'int', default: 0 })
  sellPrice!: number;

  /** Danh sach xe tuong thich — chuoi tu do, vi du "Honda Super Cub 110". */
  @Column({ name: 'compatible_vehicles', type: 'jsonb', default: () => "'[]'" })
  compatibleVehicles!: string[];

  @Column({ name: 'image_urls', type: 'jsonb', default: () => "'[]'" })
  imageUrls!: string[];

  /** Nguon tao ban ghi: MANUAL hoac AI_IMAGE (AI-04). Luon co nguoi duyet. */
  @Column({ name: 'created_source', length: 16, default: 'MANUAL' })
  createdSource!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => Inventory, (i) => i.part)
  inventories!: Inventory[];
}
