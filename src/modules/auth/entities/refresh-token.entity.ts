import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserRole } from 'src/common/enums';

/**
 * Refresh token co the thu hoi — NFR-SE-03.
 * Luu bam token de lo CSDL khong dung duoc de dang nhap tiep.
 */
@Entity('refresh_tokens')
@Index(['subjectId', 'revokedAt'])
export class RefreshToken extends BaseEntity {
  @Column({ name: 'subject_id', type: 'uuid' })
  subjectId!: string;

  @Column({ name: 'subject_role', type: 'enum', enum: UserRole })
  subjectRole!: UserRole;

  @Index({ unique: true })
  @Column({ name: 'token_hash', length: 255 })
  tokenHash!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', name: 'user_agent', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', name: 'ip_address', length: 64, nullable: true })
  ipAddress!: string | null;
}
