import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BOOKING_OPEN_STATUSES } from 'src/common/enums';
import { APP_TZ, formatAppDate, weekdayInAppTz, zonedDateTimeToUtc } from 'src/common/utils';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { StoresService } from 'src/modules/stores/stores.service';
import { Booking } from './entities/booking.entity';

export interface SlotAvailability {
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  remaining: number;
  available: boolean;
  /** Ly do khong dat duoc, de SC-13 hien thay vi chi lam mo o chon. */
  reason?: 'FULL' | 'PAST' | 'CLOSED';
}

export interface DayAvailability {
  date: string;
  isHoliday: boolean;
  isClosed: boolean;
  slots: SlotAvailability[];
}

/**
 * Tinh khung gio con cho — BR-07, BR-08, BR-09.
 * Moi phep so sanh thoi gian deu quy ve gio Nhat Ban (C-03) truoc khi doi sang UTC.
 */
@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    private readonly stores: StoresService,
    private readonly settings: SettingsService,
  ) {}

  /** SC-13 — lich con cho cua mot cua hang trong khoang ngay. */
  async getRange(storeId: string, fromDate: string, days = 14): Promise<DayAvailability[]> {
    const maxAdvanceDays = this.settings.getNumber(
      SETTING_KEYS.BOOKING_MAX_ADVANCE_DAYS,
      'booking.maxAdvanceDays',
      60,
    );
    const result: DayAvailability[] = [];
    const start = new Date(`${fromDate}T00:00:00+09:00`);

    for (let offset = 0; offset < days; offset += 1) {
      const date = formatAppDate(new Date(start.getTime() + offset * 86_400_000));
      // BR-08 — khong cho dat qua xa trong tuong lai.
      if (daysFromToday(date) > maxAdvanceDays) break;
      result.push(await this.getDay(storeId, date));
    }
    return result;
  }

  async getDay(storeId: string, date: string): Promise<DayAvailability> {
    const weekday = weekdayInAppTz(new Date(`${date}T12:00:00+09:00`));
    const [isHoliday, businessHour, slots] = await Promise.all([
      this.stores.isHoliday(storeId, date),
      this.stores.getBusinessHour(storeId, weekday),
      this.stores.getSlotsForWeekday(storeId, weekday),
    ]);

    const isClosed = Boolean(businessHour?.isClosed) || slots.length === 0;
    if (isHoliday || isClosed) {
      return {
        date,
        isHoliday,
        isClosed,
        slots: slots.map((slot) => ({
          startTime: slot.startTime.slice(0, 5),
          endTime: slot.endTime.slice(0, 5),
          capacity: slot.capacity,
          booked: 0,
          remaining: 0,
          available: false,
          reason: 'CLOSED' as const,
        })),
      };
    }

    const counts = await this.countBookingsBySlot(storeId, date);
    const now = Date.now();

    return {
      date,
      isHoliday: false,
      isClosed: false,
      slots: slots.map((slot) => {
        const startTime = slot.startTime.slice(0, 5);
        const endTime = slot.endTime.slice(0, 5);
        const booked = counts.get(startTime) ?? 0;
        const remaining = Math.max(0, slot.capacity - booked);
        const isPast = zonedDateTimeToUtc(date, startTime).getTime() <= now;

        let reason: SlotAvailability['reason'];
        if (isPast) reason = 'PAST';
        else if (remaining === 0) reason = 'FULL';

        return {
          startTime,
          endTime,
          capacity: slot.capacity,
          booked,
          remaining,
          available: !isPast && remaining > 0,
          reason,
        };
      }),
    };
  }

  /**
   * BR-07 — chan dat vuot nang luc tiep nhan.
   * Goi ngay truoc khi ghi lich hen; van con kha nang hai yeu cau cuoi cung
   * chay song song nen tang goi phai nam trong giao dich co khoa cua hang.
   */
  async assertSlotAvailable(
    storeId: string,
    date: string,
    startTime: string,
    excludeBookingId?: string,
  ): Promise<void> {
    const day = await this.getDay(storeId, date);

    if (day.isHoliday) {
      throw new BadRequestException({
        code: 'STORE_HOLIDAY',
        message: 'Cua hang nghi vao ngay nay',
      });
    }
    if (day.isClosed) {
      throw new BadRequestException({
        code: 'STORE_CLOSED',
        message: 'Cua hang khong lam viec vao ngay nay',
      });
    }

    const slot = day.slots.find((s) => s.startTime === startTime);
    if (!slot) {
      throw new BadRequestException({
        code: 'SLOT_NOT_FOUND',
        message: 'Khung gio khong ton tai',
      });
    }
    if (slot.reason === 'PAST') {
      throw new BadRequestException({
        code: 'SLOT_IN_PAST',
        message: 'Khung gio da qua',
      });
    }

    // Khi doi lich, lich dang sua khong duoc tinh vao so da dat.
    let booked = slot.booked;
    if (excludeBookingId) {
      const own = await this.bookingRepo.count({
        where: {
          id: excludeBookingId,
          storeId,
          slotStartTime: `${startTime}:00`,
          status: In(BOOKING_OPEN_STATUSES),
        },
      });
      booked -= own;
    }
    if (booked >= slot.capacity) {
      throw new BadRequestException({
        code: 'SLOT_FULL',
        message: 'Khung gio da het cho, vui long chon gio khac',
      });
    }
  }

  /** Dem lich hen dang mo theo tung khung gio cua mot ngay. */
  private async countBookingsBySlot(storeId: string, date: string): Promise<Map<string, number>> {
    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.slot_start_time', 'slotStartTime')
      .addSelect('COUNT(*)', 'count')
      .where('b.store_id = :storeId', { storeId })
      .andWhere(`(b.scheduled_at AT TIME ZONE :tz)::date = :date`, { tz: APP_TZ, date })
      .andWhere('b.status IN (:...statuses)', { statuses: BOOKING_OPEN_STATUSES })
      .groupBy('b.slot_start_time')
      .getRawMany<{ slotStartTime: string; count: string }>();

    return new Map(rows.map((r) => [r.slotStartTime.slice(0, 5), Number(r.count)]));
  }
}

function daysFromToday(date: string): number {
  const today = new Date(`${formatAppDate(new Date())}T00:00:00+09:00`).getTime();
  const target = new Date(`${date}T00:00:00+09:00`).getTime();
  return Math.round((target - today) / 86_400_000);
}
