/** Trang thai phieu dich vu — RD-2026-001 §5.2. */
export enum WorkOrderStatus {
  RECEIVED = 'RECEIVED',
  DIAGNOSING = 'DIAGNOSING',
  QUOTED = 'QUOTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export const WORK_ORDER_TRANSITIONS: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  [WorkOrderStatus.RECEIVED]: [WorkOrderStatus.DIAGNOSING, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.DIAGNOSING]: [
    WorkOrderStatus.QUOTED,
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.CANCELLED,
  ],
  [WorkOrderStatus.QUOTED]: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.IN_PROGRESS]: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  [WorkOrderStatus.COMPLETED]: [WorkOrderStatus.DELIVERED],
  [WorkOrderStatus.DELIVERED]: [],
  [WorkOrderStatus.CANCELLED]: [],
};

/** Trang thai thanh toan — truong rieng, doc lap voi trang thai phieu. */
export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD_AT_STORE = 'CARD_AT_STORE',
  OTHER = 'OTHER',
}

/** Muc do kho cua phieu — SA-10a cho ky thuat vien chon. */
export enum WorkDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
