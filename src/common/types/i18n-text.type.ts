import { Language } from '../enums';

/**
 * Chuoi da ngon ngu luu dang jsonb — C-02, FR-I18N-04.
 * Thieu ngon ngu nao thi lui ve tieng Nhat.
 */
export type I18nText = Partial<Record<Language, string>>;

export function pickI18n(text: I18nText | null | undefined, lang: Language): string {
  if (!text) return '';
  return text[lang] ?? text[Language.JA] ?? text[Language.EN] ?? text[Language.VI] ?? '';
}
