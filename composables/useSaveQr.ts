/**
 * Luu anh ma QR cua lich hen ve may — dung chung o SC-16 va SC-26.
 *
 * Hai noi den khac nhau, tuy may:
 *
 * - Dien thoai, may tinh bang: khach muon ma QR nam trong thu vien anh de
 *   luc den cua hang mo ra cho nhanh. Trang web khong duoc phep tu ghi vao
 *   thu muc anh — khong trinh duyet nao cho, va cung khong nen cho. Duong
 *   hop le duy nhat la dua tep cho he dieu hanh qua bang chia se, roi khach
 *   bam "Luu anh" (iOS) hoac "Luu vao anh" (Android).
 * - May tinh: tai thang xuong thu muc Tai ve.
 *
 * Phai tu hoi dang o may nao, vi `navigator.canShare` khong tra loi giup:
 * Chrome tren Windows cung nhan chia se kem tep. Cu goi bua thi khach ngoi
 * may ban bam Luu lai thay hop Chia se cua Windows hien ra — trong do khong
 * he co muc nao luu anh.
 *
 * May cu khong tai duoc tep tu trang thi lui them mot buoc nua: mo anh ra
 * tab moi de khach nhan giu va luu tay.
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
    const file = isHandheld() ? toFile(dataUrl, fileName) : null;

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

    // Noi ro thu muc chu khong chi dua moi ten tep: khach vua bam xong thi
    // dieu ho can biet la bay gio mo no o dau.
    if (downloadDataUrl(dataUrl, fileName)) {
      ui.success(t('sc16.qrSaved'), t('sc16.qrSavedWhere', { file: fileName }));
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
