import type { BookingServiceType, ServiceType } from '~/types/enums';

/**
 * Ba nhom khach chon o SC-12, dung chung voi SC-10. Danh muc dich vu con co
 * nhom PACKAGE nhung do la cach dong goi chu khong phai viec can lam, nen goi
 * xep chung voi bao duong.
 */
export const BOOKING_KINDS = ['MAINTENANCE', 'REPAIR', 'INSPECTION'] as const;
export type BookingKind = (typeof BOOKING_KINDS)[number];

/** Dich vu thuoc nhom nao trong ba nhom khach nhin thay. */
export function kindOfService(type: ServiceType | string): BookingKind {
  return type === 'REPAIR' || type === 'INSPECTION' ? type : 'MAINTENANCE';
}

/**
 * Doi tap nhom dang chon thanh loai dich vu cua lich hen. Tu hai nhom tro len
 * thi lich hen duoc danh dau BOTH.
 */
export function bookingServiceTypeOf(kinds: Iterable<BookingKind>): BookingServiceType {
  const set = new Set(kinds);
  if (set.size === 0) return 'MAINTENANCE';
  if (set.size > 1) return 'BOTH';
  return [...set][0];
}

/** Nguoc lai: loai dich vu cua lich hen ung voi nhung nhom nao. */
export function kindsOfBookingServiceType(type: BookingServiceType): Set<BookingKind> {
  if (type === 'BOTH') return new Set<BookingKind>(['MAINTENANCE', 'REPAIR']);
  return new Set<BookingKind>([type]);
}
