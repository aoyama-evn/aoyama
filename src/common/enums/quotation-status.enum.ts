/** Trang thai bao gia — RD-2026-001 §5.3. */
export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  SUPERSEDED = 'SUPERSEDED',
}

export const QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  [QuotationStatus.DRAFT]: [QuotationStatus.SENT],
  [QuotationStatus.SENT]: [
    QuotationStatus.ACCEPTED,
    QuotationStatus.REJECTED,
    QuotationStatus.SUPERSEDED,
  ],
  [QuotationStatus.ACCEPTED]: [],
  [QuotationStatus.REJECTED]: [],
  [QuotationStatus.SUPERSEDED]: [],
};

/**
 * Khach tra loi bao gia bang duong nao — SA-12c.
 *
 * LINK la khach tu bam tren site. COUNTER va PHONE la nhan vien ghi ho
 * khi khach tra loi tai quay hoac qua dien thoai; hai truong hop do phai
 * phan biet duoc voi khach tu bam, vi trach nhiem khac nhau.
 */
export enum QuotationReplyChannel {
  LINK = 'LINK',
  COUNTER = 'COUNTER',
  PHONE = 'PHONE',
}
