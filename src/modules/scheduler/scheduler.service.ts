import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, LessThan, Repository } from 'typeorm';
import { BookingStatus, NotificationChannel, NotificationEvent } from 'src/common/enums';
import { formatAppDate, formatAppDateTime } from 'src/common/utils';
import { pickI18n } from 'src/common/types';
import { AiService } from 'src/modules/ai/ai.service';
import { BookingsService } from 'src/modules/bookings/bookings.service';
import { Booking } from 'src/modules/bookings/entities/booking.entity';
import { CustomersService } from 'src/modules/customers/customers.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { OtpService } from 'src/modules/auth/otp.service';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { VehiclesService } from 'src/modules/vehicles/vehicles.service';

/**
 * Tien trinh nen — FR-NOT-03, FR-NOT-05, BR-13.
 * Moi tac vu deu tu bao ve: loi cua mot tac vu khong duoc lam dung cac tac vu khac.
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly bookings: BookingsService,
    private readonly customers: CustomersService,
    private readonly vehicles: VehiclesService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
    private readonly otp: OtpService,
    private readonly ai: AiService,
  ) {}

  /**
   * FR-NOT-03 — nhac lich truoc gio hen.
   * Chay moi 15 phut de moc nhac khong lech qua xa nguong cau hinh.
   */
  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'booking-reminder' })
  async sendBookingReminders(): Promise<void> {
    try {
      const hoursBefore = this.settings.getNumber(
        SETTING_KEYS.BOOKING_REMINDER_HOURS_BEFORE,
        'booking.reminderHoursBefore',
        12,
      );
      const now = Date.now();
      const windowStart = new Date(now);
      const windowEnd = new Date(now + hoursBefore * 3_600_000);

      const due = await this.bookingRepo.find({
        where: {
          status: BookingStatus.CONFIRMED,
          scheduledAt: Between(windowStart, windowEnd),
          reminderSentAt: IsNull(),
        },
        relations: { customer: true, store: true },
        take: 200,
      });

      for (const booking of due) {
        if (booking.reminderSentAt) continue;
        const customer = booking.customer ?? (await this.customers.findById(booking.customerId));
        if (!customer.notifySms) {
          await this.bookings.markReminderSent(booking.id);
          continue;
        }

        await this.notifications.send({
          event: NotificationEvent.BOOKING_REMINDER,
          channel: NotificationChannel.SMS,
          language: customer.language,
          recipient: booking.contactPhone,
          customerId: customer.id,
          variables: {
            bookingCode: booking.code,
            customerName: booking.contactName,
            scheduledAt: formatAppDateTime(booking.scheduledAt),
            storeName: booking.store ? pickI18n(booking.store.name, customer.language) : '',
          },
          relatedType: 'Booking',
          relatedId: booking.id,
        });
        await this.bookings.markReminderSent(booking.id);
      }

      if (due.length > 0) {
        this.logger.log(`Da gui ${due.length} tin nhac lich hen`);
      }
    } catch (error) {
      this.logger.error('Tac vu nhac lich hen that bai');
    }
  }

  /**
   * BR-13 — lich da xac nhan ma khach khong den sau nguong cau hinh thi
   * tu dong chuyen sang NO_SHOW, de bao cao FR-RPT-04 phan anh dung thuc te.
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'booking-no-show' })
  async markNoShowBookings(): Promise<void> {
    try {
      const afterHours = this.settings.getNumber(
        SETTING_KEYS.BOOKING_NO_SHOW_AFTER_HOURS,
        'booking.noShowAfterHours',
        24,
      );
      const cutoff = new Date(Date.now() - afterHours * 3_600_000);

      const stale = await this.bookingRepo.find({
        where: { status: BookingStatus.CONFIRMED, scheduledAt: LessThan(cutoff) },
        take: 200,
      });

      for (const booking of stale) {
        try {
          await this.bookings.markNoShow(booking.id, { type: 'SYSTEM', id: null });
        } catch (error) {
          this.logger.warn(`Khong danh dau duoc NO_SHOW cho lich ${booking.code}`);
        }
      }

      if (stale.length > 0) {
        this.logger.log(`Da danh dau ${stale.length} lich hen khach khong den`);
      }
    } catch (error) {
      this.logger.error('Tac vu danh dau khach khong den that bai');
    }
  }

  /** FR-NOT-05, AI-05 — nhac khach den ky bao duong. Chay mot lan moi ngay. */
  @Cron('0 9 * * *', { name: 'maintenance-reminder', timeZone: 'Asia/Tokyo' })
  async sendMaintenanceReminders(): Promise<void> {
    try {
      const daysBefore = this.settings.getNumber(
        SETTING_KEYS.MAINTENANCE_REMINDER_DAYS_BEFORE,
        undefined,
        14,
      );
      const horizon = formatAppDate(new Date(Date.now() + daysBefore * 86_400_000));
      const due = await this.vehicles.findDueSchedules(horizon);

      for (const schedule of due) {
        const customer = schedule.vehicle?.customer;
        if (!customer || !customer.notifySms) {
          await this.vehicles.markScheduleNotified(schedule.id);
          continue;
        }

        await this.notifications.send({
          event: NotificationEvent.MAINTENANCE_DUE,
          channel: NotificationChannel.SMS,
          language: customer.language,
          recipient: customer.phone,
          customerId: customer.id,
          variables: {
            customerName: customer.name,
            plateNumber: schedule.vehicle?.plateNumber ?? '',
            dueDate: schedule.dueDate,
          },
          relatedType: 'MaintenanceSchedule',
          relatedId: schedule.id,
        });
        await this.vehicles.markScheduleNotified(schedule.id);
      }

      if (due.length > 0) {
        this.logger.log(`Da gui ${due.length} tin nhac ky bao duong`);
      }
    } catch (error) {
      this.logger.error('Tac vu nhac ky bao duong that bai');
    }
  }

  /** Don du lieu tam: ma OTP het han va tep dinh kem qua han luu tru (RK-07). */
  @Cron('30 3 * * *', { name: 'cleanup', timeZone: 'Asia/Tokyo' })
  async cleanup(): Promise<void> {
    try {
      const otpRemoved = await this.otp.purgeExpired();
      const mediaPurged = await this.ai.purgeExpiredMedia();
      this.logger.log(`Don dep: ${otpRemoved} ma OTP, ${mediaPurged} phien chan doan`);
    } catch (error) {
      this.logger.error('Tac vu don dep that bai');
    }
  }
}
