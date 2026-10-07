/**
 * Luu anh ma QR cua lich hen ve may — dung chung o SC-16 va SC-26.
 *
 * Tren dien thoai, khach muon ma QR nam trong thu vien anh de luc den cua
 * hang mo ra cho nhanh. Trang web khong duoc phep tu ghi vao thu muc anh —
 * khong trinh duyet nao cho, va cung khong nen cho. Duong hop le duy nhat
 * la dua tep cho he dieu hanh qua bang chia se, roi khach bam "Luu anh"
 * (iOS) hoac "Luu vao anh" (Android). Nen thu bang chia se truoc.
 *
 * May tinh ban khong co bang chia se kem tep thi tai thang xuong thu muc
 * Tai ve nhu cu. May cu khong tai duoc tep tu trang thi lui them mot buoc
 * nua: mo anh ra tab moi de khach nhan giu va luu tay.
 */
export function useSaveQr() {
  const ui = useUiStore();
  const { t } = useI18n();

  /**
   * Phai dung tep TRUOC moi lenh cho, roi goi navigator.share ngay.
   *
   * Trinh duyet chi cho mo bang chia se trong lan cham cua nguoi dung; chen
   * mot `await` vao giua la cu cham do het hieu luc va loi bi tu choi.
   */
  function toFile(dataUrl: string, fileName: string): File | null {
    try {
      const blob = dataUrlToBlob(dataUrl);
      return new File([blob], fileName, { type: blob.type || 'image/png' });
    } catch {
      return null;
    }
  }

  async function saveQr(
    dataUrl: string | null | undefined,
    bookingCode: string,
  ): Promise<void> {
    if (!dataUrl) return;

    const fileName = safeFileName(`aoyama-qr-${bookingCode || 'booking'}.png`);
    const file = toFile(dataUrl, fileName);

    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: t('sc22.qrAlt', { code: bookingCode }),
        });
        // He dieu hanh da tu bao ket qua, va minh khong biet khach chon muc
        // nao trong bang chia se — khong khang dinh "da luu" cho chac.
        return;
      } catch (error) {
        // Khach dong bang chia se: do la y ho, khong phai loi, va cang
        // khong phai ly do de tu dong tai tep ve.
        if ((error as Error)?.name === 'AbortError') return;
        // Cac loi khac (trinh duyet tu choi, khong ho tro that) thi di tiep.
      }
    }

    if (downloadDataUrl(dataUrl, fileName)) {
      ui.success(t('sc16.qrSaved'), fileName);
      return;
    }

    const win = window.open();
    if (!win) {
      ui.warning(t('sc16.popupBlocked'), t('sc16.screenshot'));
      return;
    }
    win.document.write(
      `<img src="${dataUrl}" alt="${t('sc22.qrAlt', { code: bookingCode })}" style="width:100%">`,
    );
    ui.success(t('sc16.qrOpened'), t('sc16.longPress'));
  }

  return { saveQr };
}
