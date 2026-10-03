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

/**
 * Tien do tung hang muc cong viec — SC-26 hien cho khach theo doi.
 *
 * Truoc day chi co co isDone (xong / chua xong), ma "chua xong" thi khach
 * khong biet tho da bat tay vao lam chua. Ba muc nay dung nhu bang trang
 * thai trong ban dac ta: Cho / Dang lam / Xong.
 */
export enum WorkItemState {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

/** Muc do kho cua phieu — SA-10a cho ky thuat vien chon. */
export enum WorkDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}
