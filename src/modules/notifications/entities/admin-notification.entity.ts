import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { NotificationEvent } from 'src/common/enums';

/**
 * Thong bao hien trong trang quan tri — chuong tren thanh tieu de.
 *
 * Tach han khoi notification_logs: bang do ghi lai nhung tin da gui ra ngoai
 * cho KHACH (SMS, email) de doi soat voi nha cung cap. Con day la viec cua
 * NHAN VIEN, khong gui di dau ca, chi hien tren web — dung nhu yeu cau
 * "site quan tri chi notify qua web, khong notify SMS".
 *
 * Noi dung duoc ket san luc tao thay vi dung mau: cau chu ngan, va thong bao
 * phai giu nguyen van vao luc su kien xay ra chu khong doi theo du lieu sau
 * nay (lich hen doi gio thi thong bao cu van phai ke dung gio cu).
 */
@Entity('admin_notifications')
@Index(['createdAt'])
export class AdminNotification extends BaseEntity {
  @Column({ type: 'enum', enum: NotificationEvent })
  event!: NotificationEvent;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  /** Duong dan trong trang quan tri, de bam thang vao viec can lam. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  link!: string | null;

  /**
   * Thong bao cua rieng mot cua hang. Nhan vien dang xem cua hang nao thi
   * chi thay viec cua cua hang do; de trong la viec chung ca he thong.
   */
  @Column({ name: 'store_id', type: 'uuid', nullable: true })
  storeId!: string | null;

  /**
   * Nhung tai khoan da doc. Luu theo tung nguoi chu khong mot co "da doc"
   * dung chung: ba nguoi cung truc quay, mot nguoi mo chuong ra xem ma hai
   * nguoi kia mat thong bao thi hong.
   *
   * Dung mang jsonb thay vi mot bang rieng vi mot cua hang chi co vai tai
   * khoan — khong boi them mot bang de luu vai dong.
   */
  @Column({ name: 'read_by_ids', type: 'jsonb', default: () => "'[]'" })
  readByIds!: string[];
}
