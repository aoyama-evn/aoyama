import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';

export const APP_TZ = process.env.APP_TIMEZONE ?? 'Asia/Tokyo';

/** Ngay gio nghiep vu luon tinh theo UTC+9 — C-03. */
export function nowInAppTz(): Date {
  return toZonedTime(new Date(), APP_TZ);
}

/** Ghep ngay (yyyy-MM-dd) va gio (HH:mm) theo gio Nhat roi tra ve moc UTC. */
export function zonedDateTimeToUtc(date: string, time: string): Date {
  return fromZonedTime(`${date}T${time}:00`, APP_TZ);
}

export function formatAppDate(value: Date, pattern = 'yyyy-MM-dd'): string {
  return formatInTimeZone(value, APP_TZ, pattern);
}

export function formatAppDateTime(value: Date, pattern = 'yyyy-MM-dd HH:mm'): string {
  return formatInTimeZone(value, APP_TZ, pattern);
}

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 3_600_000;
}

/** 0 = Chu nhat … 6 = Thu bay, tinh theo gio Nhat. */
export function weekdayInAppTz(value: Date): number {
  return Number(formatInTimeZone(value, APP_TZ, 'i')) % 7;
}
