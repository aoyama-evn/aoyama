import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

/**
 * Ma dat lai mat khau quan tri — SA-01b.
 * Chi luu bam ma giong OTP, khong luu ma goc (NFR-SE-05).
 */
@Entity('password_reset_tokens')
@Index(['adminUserId', 'consumedAt'])
export class PasswordResetToken extends BaseEntity {
  @Column({ name: 'admin_user_id', type: 'uuid' })
  adminUserId!: string;

  @Column({ name: 'token_hash', length: 255 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt!: Date | null;
}
