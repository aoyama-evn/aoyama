/**
 * Phan nhom cua danh muc dich vu. Ban thiet ke SC-02 chia bon nhom: bao duong,
 * sua chua, kiem tra va goi dich vu.
 */
export enum ServiceType {
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  PACKAGE = 'PACKAGE',
}

/** Loai dich vu khach chon khi dat lich (co the ca hai). */
export enum BookingServiceType {
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  BOTH = 'BOTH',
}
