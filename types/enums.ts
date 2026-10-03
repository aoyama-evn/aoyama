/**
 * Cac gia tri liet ke phai khop tuyet doi voi src/common/enums cua backend.
 * Khi doi ben nao thi phai doi ca hai — day la giao uoc giua hai repo.
 */

export const BookingStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const WorkOrderStatus = {
  RECEIVED: 'RECEIVED',
  DIAGNOSING: 'DIAGNOSING',
  QUOTED: 'QUOTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type WorkOrderStatus = (typeof WorkOrderStatus)[keyof typeof WorkOrderStatus];

/** Thu tu cac moc hien tren thanh tien do CP-19. */
export const WORK_ORDER_FLOW: WorkOrderStatus[] = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.DIAGNOSING,
  WorkOrderStatus.QUOTED,
  WorkOrderStatus.IN_PROGRESS,
  WorkOrderStatus.COMPLETED,
  WorkOrderStatus.DELIVERED,
];

export const QuotationStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  SUPERSEDED: 'SUPERSEDED',
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CARD_AT_STORE: 'CARD_AT_STORE',
  OTHER: 'OTHER',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

/** Bon nhom cua danh muc dich vu — theo SC-02 cua ban thiet ke. */
export const ServiceType = {
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
  INSPECTION: 'INSPECTION',
  PACKAGE: 'PACKAGE',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

export const BookingServiceType = {
  MAINTENANCE: 'MAINTENANCE',
  REPAIR: 'REPAIR',
  INSPECTION: 'INSPECTION',
  /** Khach chon tu hai nhom tro len trong cung mot lich hen. */
  BOTH: 'BOTH',
} as const;
export type BookingServiceType = (typeof BookingServiceType)[keyof typeof BookingServiceType];

export const AdminRole = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const UserRole = {
  GUEST: 'R-GUEST',
  USER: 'R-USER',
  ADMIN: 'R-ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const InventoryTxType = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
  RETURN: 'RETURN',
} as const;
export type InventoryTxType = (typeof InventoryTxType)[keyof typeof InventoryTxType];

export const NotificationChannel = { SMS: 'SMS', EMAIL: 'EMAIL' } as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationSendStatus = {
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  FAILED: 'FAILED',
} as const;
export type NotificationSendStatus =
  (typeof NotificationSendStatus)[keyof typeof NotificationSendStatus];

export type LanguageCode = 'en' | 'vi' | 'ja';

/** Loai nhien lieu cua xe — SC-30 va SA-21 deu hoi truong nay. */
export const VehicleFuelType = {
  GASOLINE: 'GASOLINE',
  ELECTRIC: 'ELECTRIC',
  HYBRID: 'HYBRID',
} as const;
export type VehicleFuelType = (typeof VehicleFuelType)[keyof typeof VehicleFuelType];

/** Muc do kho cua phieu — SA-10a cho ky thuat vien chon. */
export const WorkDifficulty = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type WorkDifficulty = (typeof WorkDifficulty)[keyof typeof WorkDifficulty];

/** Tien do tung hang muc cong viec — SA-10, SC-26. */
export enum WorkItemState {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
