/**
 * Trang thai lich hen — RD-2026-001 §5.1.
 * Chuyen tiep hop le duoc dinh nghia tai BOOKING_TRANSITIONS.
 */
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RECEIVED = 'RECEIVED',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.RECEIVED,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
  ],
  /**
   * Xe da vao xuong thi duong ra binh thuong la DONE luc ban giao. Nhung
   * phieu dich vu co the bi huy giua chung (khach doi y, xe khong sua duoc),
   * khi do lich hen phai duoc dong theo — truoc day no ket lai o RECEIVED
   * vinh vien vi day la duong cut duy nhat trong ca may trang thai.
   *
   * Duong nay danh cho buoc huy phieu goi sang, khong phai de khach tu bam:
   * xem chot chan trong BookingsService.cancel.
   */
  [BookingStatus.RECEIVED]: [BookingStatus.DONE, BookingStatus.CANCELLED],
  [BookingStatus.DONE]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.NO_SHOW]: [],
};

export const BOOKING_OPEN_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.RECEIVED,
];
