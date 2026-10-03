import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEvent } from 'src/common/enums';
import { AdminNotification } from './entities/admin-notification.entity';

export interface PushAdminNotificationInput {
  event: NotificationEvent;
  title: string;
  body: string;
  link?: string | null;
  storeId?: string | null;
}

/** Bao nhieu dong giu lai tren chuong — qua so nay thi xem o trang nhat ky. */
const FEED_LIMIT = 30;

/**
 * Thong bao trong trang quan tri (chuong tren thanh tieu de).
 *
 * Khong gui gi ra ngoai: day la viec cua nhan vien, chi hien tren web. Tin
 * nhan SMS gui cho khach nam o NotificationsService va bang
 * notification_logs, hai thu khong lien quan nhau.
 */
@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    @InjectRepository(AdminNotification)
    private readonly repo: Repository<AdminNotification>,
  ) {}

  /**
   * Ghi mot thong bao cho nhan vien.
   *
   * Khong nem ngoai le: khong bao duoc cho nhan vien thi cung khong duoc lam
   * hong viec nghiep vu vua chay xong (lich hen da dat, bao gia da chot).
   */
  async push(input: PushAdminNotificationInput): Promise<void> {
    try {
      await this.repo.insert({
        event: input.event,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        storeId: input.storeId ?? null,
        readByIds: [],
      });
    } catch (error) {
      this.logger.warn(`Khong ghi duoc thong bao quan tri: ${(error as Error).message}`);
    }
  }

  /** Cua hang dang xem quyet dinh thay gi; de trong thi thay tat ca. */
  private scoped(storeId?: string) {
    const qb = this.repo.createQueryBuilder('n');
    if (storeId) {
      qb.where('(n.store_id = :storeId OR n.store_id IS NULL)', { storeId });
    }
    return qb;
  }

  async list(userId: string, storeId?: string): Promise<(AdminNotification & { read: boolean })[]> {
    const rows = await this.scoped(storeId)
      .orderBy('n.createdAt', 'DESC')
      .take(FEED_LIMIT)
      .getMany();
    return rows.map((row) => ({ ...row, read: (row.readByIds ?? []).includes(userId) }));
  }

  /**
   * Dem so thong bao nguoi nay chua doc.
   *
   * Loc ngay trong SQL thay vi nap het ve roi dem: danh sach nay chi dai ra
   * theo thoi gian, va con so nay duoc goi lai moi lan doi trang.
   */
  async unreadCount(userId: string, storeId?: string): Promise<{ count: number }> {
    const count = await this.scoped(storeId)
      .andWhere('NOT (n.read_by_ids @> :me::jsonb)', { me: JSON.stringify([userId]) })
      .getCount();
    return { count };
  }

  async markRead(id: string, userId: string): Promise<void> {
    // jsonb_insert khong co ban "them neu chua co", nen loc trung roi noi lai.
    await this.repo.query(
      `update admin_notifications
          set read_by_ids = (
            select coalesce(jsonb_agg(distinct x), '[]'::jsonb)
              from jsonb_array_elements(read_by_ids || $2::jsonb) as x
          )
        where id = $1`,
      [id, JSON.stringify([userId])],
    );
  }

  async markAllRead(userId: string, storeId?: string): Promise<void> {
    const rows = await this.scoped(storeId).select('n.id').getMany();
    for (const row of rows) await this.markRead(row.id, userId);
  }
}
