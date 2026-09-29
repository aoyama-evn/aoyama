/**
 * Luu anh ma QR cua lich hen ve may — dung chung o SC-16 va SC-26.
 *
 * May cu khong tai duoc tep tu trang thi lui ve cach cu: mo anh ra tab moi de
 * khach nhan giu va luu tay.
 */
export function useSaveQr() {
  const ui = useUiStore();
  const { t } = useI18n();

  function saveQr(dataUrl: string | null | undefined, bookingCode: string): void {
    if (!dataUrl) return;

    const fileName = safeFileName(`aoyama-qr-${bookingCode || 'booking'}.png`);
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
