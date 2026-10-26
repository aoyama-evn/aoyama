/**
 * Lay mot khung hinh dai dien tu doan video khach quay.
 *
 * Video gui len chi de nguyen thi khong ai doc duoc gi tu no: nhan vien
 * phai mo ra bam xem, con may thi khong giai ma duoc. Rut lay mot khung
 * thi doan video co them mot anh tinh di kem — hien duoc ngay trong danh
 * sach, va sau nay noi mo hinh nhin anh vao thi cung dung duoc luon.
 *
 * Mot khung chu khong phai nhieu: muc dich la co thu de nhin, khong phai
 * dung lai ca doan phim. Them anh la them dung luong, ma than yeu cau gui
 * len chi co 15MB.
 */

/** Giay thu may thi lay. Dau video hay bi mo hoac toi vi camera chua on dinh. */
const GIAY_LAY = 1.0;

/** Canh dai nhat cua anh rut ra. Du de nhin, khong lam phinh yeu cau gui len. */
const CANH_TOI_DA = 960;

/**
 * Tra ve data URL cua mot khung hinh, hoac null neu khong lay duoc.
 *
 * Khong nem ngoai le: khung hinh la thu co thi tot, khong co cung khong
 * duoc chan khach gui video di.
 */
export function videoFrame(videoDataUrl: string): Promise<string | null> {
  if (!import.meta.client) return Promise.resolve(null);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    let xong = false;

    const tra = (ket: string | null): void => {
      if (xong) return;
      xong = true;
      video.removeAttribute('src');
      video.load();
      resolve(ket);
    };

    // Video hong, thieu codec, hay treo giua chung thi bo qua — khong de
    // mot loi phu lam ket ca luong gui tin.
    video.onerror = () => tra(null);
    const hetGio = setTimeout(() => tra(null), 10_000);

    video.onseeked = () => {
      clearTimeout(hetGio);
      try {
        const { videoWidth: w, videoHeight: h } = video;
        if (!w || !h) return tra(null);

        const ty = Math.min(1, CANH_TOI_DA / Math.max(w, h));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * ty);
        canvas.height = Math.round(h * ty);

        const ctx = canvas.getContext('2d');
        if (!ctx) return tra(null);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // JPEG chu khong PNG: anh chup that nen JPEG nho hon nhieu lan.
        tra(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        // Canvas bi "nhiem ban" boi nguon khac mien thi khong doc ra duoc.
        tra(null);
      }
    };

    video.onloadedmetadata = () => {
      // Video ngan hon moc dinh lay thi lui ve giua doan.
      const giay = video.duration && video.duration > GIAY_LAY ? GIAY_LAY : (video.duration || 0) / 2;
      video.currentTime = Number.isFinite(giay) ? giay : 0;
    };

    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = videoDataUrl;
  });
}
