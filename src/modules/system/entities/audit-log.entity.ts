import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

/**
 * Nhat ky thao tac — FR-SYS-03..06, xem tai SA-44.
 * Chi ghi them: khong co duong dan nghiep vu nao duoc sua hay xoa ban ghi o day.
 */
@Entity('audit_logs')
@Index(['entity', 'entityId', 'createdAt'])
@Index(['actorId', 'createdAt'])
export class AuditLog extends BaseEntity {
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({ type: 'varchar', name: 'actor_name', length: 128, nullable: true })
  actorName!: string | null;

  /** ADMIN | CUSTOMER | SYSTEM */
  @Column({ name: 'actor_type', length: 16 })
  actorType!: string;

  @Column({ length: 64 })
  action!: string;

  @Column({ length: 64 })
  entity!: string;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId!: string | null;

  /** Chi luu cac truong thay doi, da loai bo du lieu nhay cam (NFR-SE-11). */
  @Column({ name: 'changes', type: 'jsonb', nullable: true })
  changes!: Record<string, unknown> | null;

  @Column({ type: 'varchar', name: 'ip_address', length: 64, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', name: 'user_agent', length: 255, nullable: true })
  userAgent!: string | null;
}
