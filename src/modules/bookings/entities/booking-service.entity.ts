import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Service } from 'src/modules/catalog/entities/service.entity';
import { Booking } from './booking.entity';

/**
 * Dich vu khach chon khi dat lich — FR-BOOK-02.
 * Ten va gia duoc chup lai tai thoi diem dat de bang gia thay doi ve sau
 * khong lam sai lech lich hen da tao (BR-37).
 */
@Entity('booking_services')
export class BookingService extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => Booking, (b) => b.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'service_id', type: 'uuid', nullable: true })
  serviceId!: string | null;

  @ManyToOne(() => Service, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'service_id' })
  service!: Service | null;

  @Column({ name: 'service_name', length: 255 })
  serviceName!: string;

  @Column({ name: 'estimated_price', type: 'int', default: 0 })
  estimatedPrice!: number;

  @Column({ name: 'estimated_minutes', type: 'int', default: 60 })
  estimatedMinutes!: number;
}
