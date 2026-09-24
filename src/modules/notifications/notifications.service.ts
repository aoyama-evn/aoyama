import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import {
  DEFAULT_LANGUAGE,
  Language,
  NotificationChannel,
  NotificationEvent,
  NotificationSendStatus,
} from 'src/common/enums';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { MAIL_PROVIDER, MailProvider } from './providers/mail.provider';
import { SMS_PROVIDER, SmsProvider } from './providers/sms.provider';

export interface SendNotificationInput {
  event: NotificationEvent;
  channel: NotificationChannel;
  language?: Language;
  /** So dien thoai (SMS) hoac dia chi email. */
  recipient: string;
  customerId?: string | null;
  variables: Record<string, string | number>;
  relatedType?: string;
  relatedId?: string;
}

/**
 * M-14 — Thong bao.
 * Moi lan gui deu de lai mot dong o notification_logs du thanh cong hay that bai,
 * vi SA-42 la cho duy nhat cua hang doi soat duoc voi nha cung cap (FR-NOT-12).
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(MAIL_PROVIDER) private readonly mail: MailProvider,
  ) {}

  /**
   * Gui mot thong bao. Khong nem ngoai le ra ngoai: mot SMS that bai khong duoc
   * lam hong viec tao lich hen da thanh cong (FR-NOT-13 — co hang doi va thu lai).
   */
  async send(input: SendNotificationInput): Promise<NotificationLog | null> {
    const language = input.language ?? DEFAULT_LANGUAGE;
    const template = await this.resolveTemplate(input.event, input.channel, language);

    if (!template) {
      this.logger.warn(`Thieu mau ${input.event}/${input.channel}/${language}`);
      return null;
    }

    const body = render(template.body, input.variables);
    const subject = template.subject ? render(template.subject, input.variables) : null;

    const log = this.logRepo.create({
      customerId: input.customerId ?? null,
      event: input.event,
      channel: input.channel,
      language,
      recipient: input.recipient,
      subject,
      body,
      status: NotificationSendStatus.QUEUED,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    });
    await this.logRepo.save(log);

    try {
      const result =
        input.channel === NotificationChannel.SMS
          ? await this.sms.send(input.recipient, body)
          : await this.mail.send(input.recipient, subject ?? '', body);

      log.status = result.success ? NotificationSendStatus.SENT : NotificationSendStatus.FAILED;
      log.sentAt = result.success ? new Date() : null;
      log.providerMessageId = result.providerMessageId ?? null;
      log.errorMessage = result.error ?? null;
    } catch (error) {
      log.status = NotificationSendStatus.FAILED;
      log.errorMessage = error instanceof Error ? error.message : 'Loi khong xac dinh';
    }

    return this.logRepo.save(log);
  }

  /** Thu lai mot ban ghi that bai — FR-NOT-13, thao tac tu SA-42. */
  async retry(logId: string): Promise<NotificationLog | null> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log || log.status === NotificationSendStatus.SENT) return log;

    try {
      const result =
        log.channel === NotificationChannel.SMS
          ? await this.sms.send(log.recipient, log.body)
          : await this.mail.send(log.recipient, log.subject ?? '', log.body);

      log.status = result.success ? NotificationSendStatus.SENT : NotificationSendStatus.FAILED;
      log.sentAt = result.success ? new Date() : null;
      log.providerMessageId = result.providerMessageId ?? null;
      log.errorMessage = result.error ?? null;
    } catch (error) {
      log.errorMessage = error instanceof Error ? error.message : 'Loi khong xac dinh';
    }
    log.retryCount += 1;
    return this.logRepo.save(log);
  }

  /** Lui ve tieng Nhat khi chua co mau cho ngon ngu yeu cau. */
  private async resolveTemplate(
    event: NotificationEvent,
    channel: NotificationChannel,
    language: Language,
  ): Promise<NotificationTemplate | null> {
    const exact = await this.templateRepo.findOne({
      where: { event, channel, language, isActive: true },
    });
    if (exact) return exact;
    return this.templateRepo.findOne({
      where: { event, channel, language: DEFAULT_LANGUAGE, isActive: true },
    });
  }

  // ---- SA-41 Mau thong bao ----

  async listTemplates(): Promise<NotificationTemplate[]> {
    return this.templateRepo.find({ order: { event: 'ASC', channel: 'ASC', language: 'ASC' } });
  }

  async updateTemplate(
    id: string,
    patch: Partial<Pick<NotificationTemplate, 'subject' | 'body' | 'isActive'>>,
    updatedById?: string,
  ): Promise<NotificationTemplate> {
    await this.templateRepo.update(id, { ...patch, updatedById: updatedById ?? null });
    return this.templateRepo.findOneOrFail({ where: { id } });
  }

  // ---- SA-42 Nhat ky gui ----

  async searchLogs(
    query: PaginationQueryDto & {
      event?: NotificationEvent;
      channel?: NotificationChannel;
      status?: NotificationSendStatus;
      recipient?: string;
      from?: string;
      to?: string;
    },
  ): Promise<PageDto<NotificationLog>> {
    const qb = this.logRepo.createQueryBuilder('log');
    if (query.event) qb.andWhere('log.event = :event', { event: query.event });
    if (query.channel) qb.andWhere('log.channel = :channel', { channel: query.channel });
    if (query.status) qb.andWhere('log.status = :status', { status: query.status });
    if (query.recipient) {
      qb.andWhere('log.recipient ILIKE :recipient', { recipient: `%${query.recipient}%` });
    }
    if (query.from) qb.andWhere('log.created_at >= :from', { from: query.from });
    if (query.to) qb.andWhere('log.created_at <= :to', { to: query.to });

    const [items, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }
}

/** Thay bien dang {{ten}} trong mau. Bien thieu duoc thay bang chuoi rong. */
function render(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}
