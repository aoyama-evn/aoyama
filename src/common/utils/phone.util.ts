import { BadRequestException } from '@nestjs/common';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

/**
 * Chuan hoa so dien thoai ve E.164 — BR-01.
 * Khach hang duoc dinh danh bang so dien thoai da chuan hoa, nen moi diem vao
 * (dat lich, dang ky, admin tao ho so) deu phai di qua ham nay.
 */
export function normalizePhone(raw: string, defaultCountry: 'JP' | 'VN' = 'JP'): string {
  const parsed = parsePhoneNumberFromString(raw?.trim() ?? '', defaultCountry);
  if (!parsed || !parsed.isValid()) {
    throw new BadRequestException({
      code: 'INVALID_PHONE',
      message: 'So dien thoai khong hop le',
    });
  }
  return parsed.number;
}

export function isValidPhone(raw: string, defaultCountry: 'JP' | 'VN' = 'JP'): boolean {
  const parsed = parsePhoneNumberFromString(raw?.trim() ?? '', defaultCountry);
  return Boolean(parsed?.isValid());
}

/** Che so dien thoai khi hien thi trong nhat ky — NFR-SE-11. */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 5) return '***';
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}
