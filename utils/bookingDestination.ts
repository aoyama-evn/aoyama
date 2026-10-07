/**
 * Bam vao mot lich hen thi den thang viec dang cho o do.
 *
 * Dinh nghia nam o day chu khong chep lai o tung man: danh sach lich hen,
 * chuong thong bao va man bao gia deu phai dan ve cung mot cho. Mot viec
 * ma co hai duong di khac nhau thi nhan vien phai nho duong nao di dau.
 *
 * Nhung buoc khong co ten trong bang nay la nhung buoc chua co viec ro
 * rang gan vao mot man rieng (cho xac nhan, da nhan xe, da ban giao, da
 * huy) — nhung truong hop do ve man chi tiet lich hen.
 */
const THEO_BUOC: Record<string, (workOrderId: string) => string> = {
  // Da kham xong, viec ke tiep la lap bao gia.
  DIAGNOSED: (wo) => `/admin/work-orders/${wo}/quotation`,
  // Da gui bao gia, viec ke tiep la doc tra loi cua khach va chot.
  QUOTING: (wo) => `/admin/work-orders/${wo}/quote-confirm`,
  // Khach da dong y nhung xuong chua bam "Tien hanh" — van la man chot.
  QUOTE_ACCEPTED: (wo) => `/admin/work-orders/${wo}/quote-confirm`,
  // Sua xong roi: viec con lai la thu tien va giao xe.
  COMPLETED: (wo) => `/admin/work-orders/${wo}/payment`,
};

/**
 * Man hinh ung voi buoc hien tai cua mot lich hen.
 *
 * Thieu ma phieu thi khong the mo man cong viec nao ca, nen ve chi tiet
 * lich hen — dung hon la dan vao mot duong dan gay.
 */
export function bookingDestination(
  stage: string | null | undefined,
  workOrderId: string | null | undefined,
  bookingId: string,
): string {
  const di = stage ? THEO_BUOC[stage] : undefined;
  return di && workOrderId ? di(workOrderId) : `/admin/bookings/${bookingId}`;
}
