import { customAlphabet } from 'nanoid';

/** Bo ky tu bo qua 0/O/1/I de nguoi lon tuoi doc va doc lai qua dien thoai duoc — C-05. */
const READABLE = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

const nanoReadable = customAlphabet(READABLE, 8);
const nanoToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

/** Ma lich hen hien cho khach — vi du "AY-7KD2QH4M". */
export function generateBookingCode(): string {
  return `AY-${nanoReadable()}`;
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
