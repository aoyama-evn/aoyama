import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { BookingStatus } from 'src/common/enums';
import { Booking } from './booking.entity';

/**
 * Nhat ky chuyen trang thai lich hen — FR-BOOK-26.
 * Doi lich khong doi trang thai nhung van ghi mot dong o day (RD muc 5.1).
 */
@Entity('booking_status_histories')
@Index(['bookingId', 'createdAt'])
export class BookingStatusHistory extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @ManyToOne(() => Booking, (b) => b.statusHistories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Booking;

  @Column({ name: 'from_status', type: 'enum', enum: BookingStatus, nullable: true })
  fromStatus!: BookingStatus | null;

  @Column({ name: 'to_status', type: 'enum', enum: BookingStatus })
  toStatus!: BookingStatus;

  /** RESCHEDULE khi chi doi thoi gian ma giu nguyen trang thai. */
  @Column({ length: 32, default: 'STATUS_CHANGE' })
  action!: string;

  @Column({ name: 'actor_type', length: 16 })
  actorType!: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ name: 'previous_scheduled_at', type: 'timestamptz', nullable: true })
  previousScheduledAt!: Date | null;
}
