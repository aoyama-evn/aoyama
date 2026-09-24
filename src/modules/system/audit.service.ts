import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditInput {
  actorId?: string | null;
  actorName?: string | null;
  actorType: 'ADMIN' | 'CUSTOMER' | 'SYSTEM';
  action: string;
  entity: string;
  entityId?: string | null;
  changes?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Nhat ky thao tac — FR-SYS-03..06. */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  /**
   * Ghi nhat ky. Loi ghi nhat ky khong duoc lam hong giao dich nghiep vu,
   * nen moi ngoai le deu bi nuot va chi ghi ra log ung dung.
   */
  async record(input: AuditInput): Promise<void> {
    try {
      await this.repo.insert({
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        actorType: input.actorType,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        // jsonb — TypeORM khong suy duoc kieu cho cot nay khi dung insert().
        changes: (input.changes ?? null) as never,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
    } catch (error) {
      this.logger.error(`Khong ghi duoc nhat ky ${input.action} ${input.entity}`);
    }
  }

  async search(
    query: PaginationQueryDto & {
      actorId?: string;
      entity?: string;
      action?: string;
      from?: string;
      to?: string;
    },
  ): Promise<PageDto<AuditLog>> {
    const qb = this.repo.createQueryBuilder('log');

    if (query.actorId) qb.andWhere('log.actor_id = :actorId', { actorId: query.actorId });
    if (query.entity) qb.andWhere('log.entity = :entity', { entity: query.entity });
    if (query.action) qb.andWhere('log.action = :action', { action: query.action });
    if (query.from) qb.andWhere('log.created_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('log.created_at <= :to', { to: query.to });

    const [items, total] = await qb
      .orderBy('log.created_at', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();

    return new PageDto(items, total, query);
  }
}
