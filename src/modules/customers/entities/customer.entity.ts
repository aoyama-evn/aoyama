import { Column, Entity, Index, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { Language } from 'src/common/enums';
import { Vehicle } from 'src/modules/vehicles/entities/vehicle.entity';

/**
 * Khach hang — BR-01: dinh danh bang so dien thoai da chuan hoa (E.164).
 * Khach vang lai cung tao ban ghi (isGuest = true) de gan lich su xe.
 */
@Entity('customers')
export class Customer extends SoftDeletableEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone!: string;

  @Column({ length: 128 })
  name!: string;

  @Column({ type: 'varchar', name: 'name_kana', length: 128, nullable: true })
  nameKana!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email!: string | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  /** true khi ho so sinh tu luong dat lich khong dang nhap — FR-BOOK-01. */
  @Column({ name: 'is_guest', default: true })
  isGuest!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'enum', enum: Language, default: Language.JA })
  language!: Language;

  @Column({ name: 'notify_sms', default: true })
  notifySms!: boolean;

  @Column({ name: 'notify_email', default: false })
  notifyEmail!: boolean;

  /** Ghi chu noi bo cua cua hang — FR-CUS-05, khong hien cho khach. */
  @Column({ name: 'internal_note', type: 'text', nullable: true })
  internalNote!: string | null;

  /** Ho so da bi gop vao ban ghi khac — FR-CUS-06. */
  @Column({ name: 'merged_into_id', type: 'uuid', nullable: true })
  mergedIntoId!: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @OneToMany(() => Vehicle, (v) => v.customer)
  vehicles!: Vehicle[];
}
