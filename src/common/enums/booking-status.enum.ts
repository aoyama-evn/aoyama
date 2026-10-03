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

/**
 * Buoc thuc te cua mot lich hen nhin tu trang quan tri — RD muc 5.1 va 5.2
 * gop lai.
 *
 * BookingStatus chi co sau gia tri va RECEIVED om tron ca giai doan sua xe,
 * nen nhin vao danh sach khong biet xe dang cho khach duyet bao gia hay
 * sap ban giao. Tam buoc nay la thu nhan vien thuc su can doc.
 *
 * Chi dung de HIEN THI. May trang thai van la BookingStatus; khong co buoc
 * nao o day duoc ghi xuong CSDL.
 */
export enum BookingStage {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  RECEIVED = 'RECEIVED',
  /** Ky thuat vien da ghi chan doan, chua gui bao gia. */
  DIAGNOSED = 'DIAGNOSED',
  /** Da gui bao gia, dang cho khach tra loi. */
  QUOTING = 'QUOTING',
  /** Khach da dong y; xuong chua bam "Tien hanh". */
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}
