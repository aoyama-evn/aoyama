import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Vehicle } from './vehicle.entity';

/**
 * Lich bao duong de xuat — AI-05, FR-NOT-05.
 * Nguon cua tien trinh nen gui nhac lich dinh ky.
 */
@Entity('maintenance_schedules')
@Index(['dueDate', 'isNotified'])
export class MaintenanceSchedule extends BaseEntity {
  @Column({ name: 'vehicle_id', type: 'uuid' })
  vehicleId!: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ name: 'due_odometer', type: 'int', nullable: true })
  dueOdometer!: number | null;

  /** Do tin cay cua goi y AI (0..100); null khi do nguoi dat thu cong. */
  @Column({ name: 'ai_confidence', type: 'int', nullable: true })
  aiConfidence!: number | null;

  @Column({ name: 'is_notified', default: false })
  isNotified!: boolean;

  @Column({ name: 'notified_at', type: 'timestamptz', nullable: true })
  notifiedAt!: Date | null;

  @Column({ name: 'is_done', default: false })
  isDone!: boolean;
}
