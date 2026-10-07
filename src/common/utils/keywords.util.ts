/**
 * Tach cau hoi thanh tu khoa de tim tai lieu ky thuat — AI-03.
 *
 * Bo tu de hoi va tu noi: chung co trong moi tai lieu nen khong giup
 * phan biet gi, ma con lam cau lac de cung khop duoc mot it.
 */
const STOPWORDS = new Set([
  'bao', 'lau', 'nhieu', 'the', 'nao', 'gi', 'khi', 'cho', 'cua', 'voi', 'thi', 'mot',
  'lan', 'can', 'phai', 'duoc', 'nhu', 'vao', 'tren', 'duoi', 'trong', 'ngoai', 'khong',
  'la', 'va', 'co', 'nen', 'hay', 'den', 'tu', 'ra', 'thi',
  'what', 'when', 'how', 'why', 'and', 'for', 'with', 'does', 'should', 'the',
]);

/**
 * Bo dau tieng Viet va ha chu thuong.
 *
 * Tai lieu trong kho viet khong dau, con nguoi hoi thi go co dau —
 * khong bo dau thi "trinh" va "trình" la hai tu khac nhau va khong cau
 * hoi nao khop duoc gi.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

export function keywordsOf(question: string): string[] {
  const words = normalise(question)
    .replace(/[?!.,;:()[\]"']/g, ' ')
    .split(/\s+/)
    // Giu chu so mot ky tu: "nhay 8 lan" thi so 8 moi la phan quan trong.
    .filter((w) => (w.length >= 2 || /^[0-9]$/.test(w)) && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 8);
}

/**
 * Tu chung chung cua nganh: tai lieu nao cung co nen khop duoc chung
 * khong chung minh dieu gi. Mot cau hoi phai khop it nhat mot tu NGOAI
 * danh sach nay thi moi coi la dung chu de.
 */
const COMMON = new Set(['xe', 'may', 'moi', 'loai', 'dong', 'hang', 'honda', 'yamaha', 'suzuki']);

export function hasDistinctiveHit(matched: string[]): boolean {
  return matched.some((w) => !COMMON.has(w));
}

/**
 * So tu khoa toi thieu mot doan phai nhac den thi moi coi la tra loi
 * duoc cau hoi. Mot tu trung thi chi la trung tu ngu, khong phai dung
 * chu de — FR-TEC-07 doi khong doan bua.
 */
export function minKeywordHits(words: string[]): number {
  // Tran o 3: cau hoi dai khong vi the ma kho hon cau ngan.
  return Math.max(2, Math.min(3, Math.ceil(words.length / 2)));
}
