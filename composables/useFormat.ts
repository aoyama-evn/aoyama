import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
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

  /**
   * Doi qua lai giua moc thoi gian cua may chu va o nhap ngay gio.
   *
   * May chu luu UTC, con nhan vien go gio cua hang. Cat thang chuoi ISO
   * thi o nhap hien gio UTC trong khi ca man con lai hien gio Nhat —
   * lech chin tieng ma nhin khong ra.
   */
  function toLocalInput(value: string | Date | null | undefined): string {
    if (!value) return '';
    return formatInTimeZone(new Date(value), tz, "yyyy-MM-dd'T'HH:mm");
  }

  function fromLocalInput(value: string): string {
    if (!value) return '';
    return fromZonedTime(value, tz).toISOString();
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

  /**
   * Ten thu viet tat theo ngon ngu dang chon. Ban thiet ke luon ghi thu ngay
   * sau ngay, dang "2026/10/22 (T5)".
   */
  const WEEKDAYS: Record<LanguageCode, string[]> = {
    vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    ja: ['日', '月', '火', '水', '木', '金', '土'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  };

  function weekday(value: string | Date | null | undefined): string {
    if (!value) return '';
    const index = Number(date(value, 'i')) % 7;
    return WEEKDAYS[(locale.value as LanguageCode)]?.[index] ?? WEEKDAYS.en[index];
  }

  /** "2026/10/22 (T5)" — dang ngay dung o hau het man hinh. */
  function dayLabel(value: string | Date | null | undefined): string {
    if (!value) return '';
    return `${date(value)} (${weekday(value)})`;
  }

  /** "2026/10/22 (T5) · 14:00–15:00" tu mot lich hen. */
  function slotRange(
    booking: { scheduledAt: string; slotStartTime: string; slotEndTime: string } | null | undefined,
  ): string {
    if (!booking) return '';
    return `${dayLabel(booking.scheduledAt)} · ${clock(booking.slotStartTime)}–${clock(booking.slotEndTime)}`;
  }

  return {
    i18n, date, dateTime, time, clock, money, number, maskedPhone, relative,
    toLocalInput, fromLocalInput,
    weekday, dayLabel, slotRange,
  };
}
