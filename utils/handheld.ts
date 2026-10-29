/**
 * May dang dung co phai may cam tay (dien thoai, may tinh bang) hay khong.
 *
 * Dung de chon cach luu tep, chu khong de doi giao dien: bo cuc van theo
 * be ngang man hinh nhu cu.
 *
 * Chuyen nay can hoi vi `navigator.canShare({ files })` KHONG phan biet
 * may: Chrome tren Windows cung tra ve true, vi Windows co bang chia se
 * rieng. Hoi moi minh no thi khach ngoi may ban bam "Luu ma QR" lai thay
 * hien ra hop Chia se cua Windows — khong co muc nao luu anh ca, trong
 * khi cai ho muon chi la tep roi vao thu muc Tai ve.
 */

/** Phan `navigator.userAgentData` ma lib.dom chua khai bao. */
type UserAgentData = { mobile?: boolean; platform?: string };

/** He dieu hanh cua may ban. Man cam ung tren Surface hay iMac van la may ban. */
const DESKTOP_PLATFORM = /windows|macos|linux|chrome os/i;

export function isHandheld(): boolean {
  if (!import.meta.client) return false;

  const uaData = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  if (uaData) {
    // Chromium noi thang. Chi tin khi no noi "co" hoac khi nen la may ban:
    // dien thoai thi mobile=true, con may tinh bang Android lai bao false,
    // nen "false" mot minh chua du de ket luan.
    if (uaData.mobile) return true;
    if (uaData.platform && DESKTOP_PLATFORM.test(uaData.platform)) return false;
  }

  // Safari chua co userAgentData. iPadOS tu ban 13 tu xung la Macintosh,
  // chi con so diem cham to cao no.
  const ua = navigator.userAgent;
  if (/iPhone|iPod|iPad|Android/i.test(ua)) return true;
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;

  // Khong con duong nao khac thi cu hoi cach nguoi ta tro: chi co ngon tay
  // va khong he co chuot thi gan nhu chac chan la may cam tay.
  return (
    matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches
  );
}
