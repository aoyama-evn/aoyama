import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from 'src/common/entities/base.entity';
import { AdminRole, Language } from 'src/common/enums';
import { Store } from 'src/modules/stores/entities/store.entity';

/**
 * Tai khoan quan tri — FR-USR-01..05, SA-39/SA-40.
 * storeId = null nghia la tai khoan nhin duoc moi cua hang. Viec bat buoc
 * gioi han theo cua hang con cho OQ-02.
 */
@Entity('admin_users')
export class AdminUser extends SoftDeletableEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  username!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 128 })
  fullName!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.STAFF })
  role!: AdminRole;

  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId!: string | null;

  @ManyToOne(() => Store, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'store_id' })
  store!: Store | null;

  @Column({ type: 'enum', enum: Language, default: Language.JA })
  language!: Language;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  /** Khoa tam sau nhieu lan dang nhap sai — NFR-SE-04. */
  @Column({ name: 'failed_login_count', type: 'smallint', default: 0 })
  failedLoginCount!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'must_change_password', default: false })
  mustChangePassword!: boolean;
}
