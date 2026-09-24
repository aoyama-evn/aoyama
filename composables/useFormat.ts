import { formatInTimeZone } from 'date-fns-tz';
import type { I18nText, LanguageCode } from '~/types/models';

/**
 * Dinh dang hien thi dung chung.
 * C-03 — moi moc thoi gian deu quy ve gio Nhat Ban truoc khi hien.
 */
export function useFormat() {
  const { locale } = useI18n();
  const tz = 'Asia/Tokyo';

  /** Lay chuoi theo ngon ngu dang chon, lui ve tieng Nhat khi thieu. */
  function i18n(text: I18nText | null | undefined): string {
    if (!text) return '';
    const lang = locale.value as LanguageCode;
    return text[lang] ?? text.ja ?? text.en ?? text.vi ?? '';
  }

  function date(value: string | Date | null | undefined, pattern = 'yyyy/MM/dd'): string {
    if (!value) return '';
    return formatInTimeZone(new Date(value), tz, pattern);
  }

  function dateTime(value: string | Date | null | undefined): string {
    return date(value, 'yyyy/MM/dd HH:mm');
  }

  function time(value: string | Date | null | undefined): string {
    return date(value, 'HH:mm');
  }

  /** Gio dang "HH:mm:ss" tu CSDL — cat phan giay khi hien. */
  function clock(value: string | null | undefined): string {
    return value ? value.slice(0, 5) : '';
  }

  /** Tien te JPY, khong co phan le. */
  function money(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return `¥${Math.round(value).toLocaleString('ja-JP')}`;
  }

  function number(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return value.toLocaleString('ja-JP');
  }

  /** Che bot so dien thoai khi hien o danh sach dung chung — NFR-SE-11. */
  function maskedPhone(value: string | null | undefined): string {
    if (!value || value.length < 5) return value ?? '';
    return `${value.slice(0, 3)}****${value.slice(-3)}`;
  }

  function relative(value: string | Date | null | undefined): string {
    if (!value) return '';
    const diffMs = new Date(value).getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    const abs = Math.abs(diffMin);

    if (abs < 1) return 'vua xong';
    if (abs < 60) return diffMin > 0 ? `sau ${abs} phut` : `${abs} phut truoc`;
    if (abs < 1440) {
      const hours = Math.round(abs / 60);
      return diffMin > 0 ? `sau ${hours} gio` : `${hours} gio truoc`;
    }
    return dateTime(value);
  }

  return { i18n, date, dateTime, time, clock, money, number, maskedPhone, relative };
}
