import { Column, Entity, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { I18nText } from 'src/common/types';
import { StoreBusinessHour } from './store-business-hour.entity';
import { StoreHoliday } from './store-holiday.entity';
import { TimeSlot } from './time-slot.entity';

/** Cua hang AOYAMA — FR-STO-01, FR-STO-02. */
@Entity('stores')
export class Store extends SoftDeletableEntity {
  @Column({ unique: true, length: 32 })
  code!: string;

  @Column({ type: 'jsonb' })
  name!: I18nText;

  @Column({ type: 'jsonb', nullable: true })
  description!: I18nText | null;

  @Column({ type: 'jsonb' })
  address!: I18nText;

  @Column({ length: 32 })
  phone!: string;

  /**
   * So fax in tren bang hieu — FR-STO-01.
   *
   * Giu nguyen cach cua hang viet ("055-921-8020") chu khong chuan hoa
   * ve E.164 nhu so dien thoai: he thong khong bao gio quay so nay, no
   * chi de nhan vien va khach doc.
   */
  @Column({ type: 'varchar', length: 32, nullable: true })
  fax!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: string | null;

  @Column({ name: 'photo_urls', type: 'jsonb', default: () => "'[]'" })
  photoUrls!: string[];

  /** Nang luc tiep nhan mac dinh cho khung gio chua cau hinh rieng — FR-STO-05. */
  @Column({ name: 'default_capacity', type: 'int', default: 3 })
  defaultCapacity!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => StoreBusinessHour, (h) => h.store, { cascade: true })
  businessHours!: StoreBusinessHour[];

  @OneToMany(() => StoreHoliday, (h) => h.store, { cascade: true })
  holidays!: StoreHoliday[];

  @OneToMany(() => TimeSlot, (s) => s.store, { cascade: true })
  timeSlots!: TimeSlot[];
}
