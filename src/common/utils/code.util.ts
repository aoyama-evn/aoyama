import { customAlphabet } from 'nanoid';
import { formatAppDateTime } from './time.util';

/** Bo ky tu bo qua 0/O/1/I de nguoi lon tuoi doc va doc lai qua dien thoai duoc — C-05. */
const READABLE = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const nanoReadable = customAlphabet(READABLE, 8);
const nanoToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

/**
 * Ma lich hen hien cho khach — dang `B-YYYYMMDDHHMMXXX`.
 *
 *   B               co dinh
 *   YYYYMMDDHHMM    luc khach bam gui lich, theo gio cua hang (Nhat Ban)
 *   XXX             lich thu may cua CHINH khach do, 000 den 999
 *
 * Doc qua dien thoai thi dai hon ma ngau nhien cu, nhung bu lai nhan vien
 * nhin ma la biet lich dat luc nao va day la khach quen hay khach moi.
 *
 * Phut dat lich cong voi so thu tu cua rieng khach do lam ma khong trung:
 * mot nguoi khong the dat hai lich trong cung mot phut ma so thu tu lai
 * giong nhau. Chay het 999 thi quay vong — khach nao dat den 1000 lan thi
 * lan 1001 roi vao phut khac, van khong dung.
 */
export function formatBookingCode(submittedAt: Date, sequence: number): string {
  const stamp = formatAppDateTime(submittedAt, 'yyyyMMddHHmm');
  const order = String(((sequence % 1000) + 1000) % 1000).padStart(3, '0');
  return `B-${stamp}${order}`;
}

/** Token kho doan cho duong dan bao gia cong khai — NFR-SE-08. */
export function generatePublicToken(): string {
  return nanoToken();
}

export function generateNumericOtp(length: number): string {
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += Math.floor(Math.random() * 10).toString();
  }
  return otp;
}

/**
 * Ma phu tung — dang `P-<NHOM><SO>`, vi du `P-ELE-0007`.
 *
 * Truoc day nhan vien phai tu dat ma, va ho dat moi nguoi mot kieu
 * ("P-OIL-10W30", "BAT-01"), nen tim theo ma thanh vo nghia. Gio he thong
 * sinh sau khi luu: ba chu dau cua nhom cho nguoi nhin la biet loai gi,
 * bon chu so chay rieng trong tung nhom.
 *
 * Nhom rong thi dung GEN — phu tung le chua xep nhom van phai co ma.
 */
export function partCodePrefix(category?: string | null): string {
  const letters = (category ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  return `P-${letters.slice(0, 3) || 'GEN'}`;
}

export function formatPartCode(category: string | null | undefined, sequence: number): string {
  return `${partCodePrefix(category)}-${String(sequence).padStart(4, '0')}`;
}
