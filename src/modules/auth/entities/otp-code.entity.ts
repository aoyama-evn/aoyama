import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

/**
 * Ma OTP gui qua SMS — FR-AUTH-03, FR-AUTH-04, BR-02.
 * Chi luu bam ma, khong luu ma goc (NFR-SE-05).
 */
@Entity('otp_codes')
@Index(['phone', 'purpose', 'consumedAt'])
export class OtpCode extends BaseEntity {
  @Column({ length: 20 })
  phone!: string;

  /** LOGIN | REGISTER | BOOKING_VERIFY — BOOKING_VERIFY phu thuoc OQ-05. */
  @Column({ length: 24 })
  purpose!: string;

  @Column({ name: 'code_hash', length: 255 })
  codeHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'attempt_count', type: 'smallint', default: 0 })
  attemptCount!: number;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;

  @Column({ type: 'varchar', name: 'ip_address', length: 64, nullable: true })
  ipAddress!: string | null;
}
