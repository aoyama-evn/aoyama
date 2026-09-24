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
