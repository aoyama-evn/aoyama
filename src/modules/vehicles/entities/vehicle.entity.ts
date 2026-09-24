import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { Customer } from 'src/modules/customers/entities/customer.entity';
import { ServiceHistory } from './service-history.entity';

/** Phuong tien — FR-VEH-01..03. Bien so la khoa nghiep vu (BR-46). */
@Entity('vehicles')
@Index(['plateNumber'], { unique: true, where: '"deleted_at" IS NULL' })
export class Vehicle extends SoftDeletableEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer, (c) => c.vehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ name: 'plate_number', length: 32 })
  plateNumber!: string;

  @Column({ length: 64 })
  maker!: string;

  @Column({ length: 64 })
  model!: string;

  @Column({ name: 'model_year', type: 'int', nullable: true })
  modelYear!: number | null;

  @Column({ name: 'engine_cc', type: 'int', nullable: true })
  engineCc!: number | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  color!: string | null;

  @Column({ type: 'varchar', name: 'vin_number', length: 64, nullable: true })
  vinNumber!: string | null;

  @Column({ name: 'current_odometer', type: 'int', nullable: true })
  currentOdometer!: number | null;

  @Column({ name: 'photo_urls', type: 'jsonb', default: () => "'[]'" })
  photoUrls!: string[];

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => ServiceHistory, (h) => h.vehicle)
  serviceHistories!: ServiceHistory[];
}
