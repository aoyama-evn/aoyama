import { Language, SUPPORTED_LANGUAGES } from '../enums';
import { I18nText } from '../types';

/**
 * Dich ten phu tung sang hai thu tieng con lai — C-02, FR-I18N-04.
 *
 * Nhan vien kho chi go ten theo thu tieng minh dang dung. Bat ho go ca ba
 * thi phan lon ban ghi se chi co mot o duoc dien, va khach xem bang hai
 * thu tieng kia se thay o trong.
 *
 * Day la ban chay tai cho, dua tren tu dien thuat ngu xe may — du cho dung
 * demo va cho moi truong khong noi mang. Khi cam dich vu dich that vao thi
 * chi phai thay than ham `render` o duoi, phan goi o PartsService giu nguyen.
 */

/** Thuat ngu phu tung xe may hay gap tai cua hang. */
const GLOSSARY: Record<Language, string>[] = [
  /**
   * Cum ghep dat truoc, va bo doi khop luon uu tien cum dai nhat. Viet san
   * ca cum thi thu tu tu trong ban dich do nguoi dat, khong phai ghep may:
   * "Ma phanh truoc" ra "Front brake pad" chu khong phai "Brake pad front".
   */
  { ja: 'フロントブレーキパッド', en: 'Front brake pad', vi: 'Má phanh trước' },
  { ja: 'リアブレーキパッド', en: 'Rear brake pad', vi: 'Má phanh sau' },
  { ja: 'フロントブレーキディスク', en: 'Front brake disc', vi: 'Đĩa phanh trước' },
  { ja: 'フロントタイヤ', en: 'Front tyre', vi: 'Lốp trước' },
  { ja: 'リアタイヤ', en: 'Rear tyre', vi: 'Lốp sau' },
  { ja: 'フロントサスペンション', en: 'Front suspension', vi: 'Phuộc trước' },
  { ja: 'リアショックアブソーバー', en: 'Rear shock absorber', vi: 'Giảm xóc sau' },
  { ja: 'フロントホイール', en: 'Front wheel', vi: 'Vành trước' },
  { ja: 'リアホイール', en: 'Rear wheel', vi: 'Vành sau' },

  { ja: 'ブレーキパッド', en: 'Brake pad', vi: 'Má phanh' },
  { ja: 'ブレーキディスク', en: 'Brake disc', vi: 'Đĩa phanh' },
  { ja: 'ブレーキシュー', en: 'Brake shoe', vi: 'Guốc phanh' },
  { ja: 'ブレーキフルード', en: 'Brake fluid', vi: 'Dầu phanh' },
  { ja: 'ブレーキ', en: 'Brake', vi: 'Phanh' },
  { ja: 'エンジンオイル', en: 'Engine oil', vi: 'Dầu máy' },
  { ja: 'オイルフィルター', en: 'Oil filter', vi: 'Lọc dầu' },
  { ja: 'エアフィルター', en: 'Air filter', vi: 'Lọc gió' },
  { ja: 'オイル', en: 'Oil', vi: 'Dầu nhớt' },
  { ja: 'スパークプラグ', en: 'Spark plug', vi: 'Bugi' },
  { ja: 'バッテリー', en: 'Battery', vi: 'Ắc quy' },
  { ja: 'タイヤ', en: 'Tyre', vi: 'Lốp xe' },
  { ja: 'チューブ', en: 'Inner tube', vi: 'Săm xe' },
  { ja: 'ドライブチェーン', en: 'Drive chain', vi: 'Xích tải' },
  { ja: 'チェーン', en: 'Chain', vi: 'Xích' },
  { ja: 'スプロケット', en: 'Sprocket', vi: 'Nhông' },
  { ja: 'ドライブベルト', en: 'Drive belt', vi: 'Dây curoa' },
  { ja: 'ベルト', en: 'Belt', vi: 'Dây đai' },
  { ja: 'クラッチ', en: 'Clutch', vi: 'Bộ ly hợp' },
  { ja: 'ピストン', en: 'Piston', vi: 'Pít-tông' },
  { ja: 'キャブレター', en: 'Carburettor', vi: 'Bình xăng con' },
  { ja: '燃料ポンプ', en: 'Fuel pump', vi: 'Bơm xăng' },
  { ja: 'ヘッドライト', en: 'Headlight', vi: 'Đèn pha' },
  { ja: 'テールランプ', en: 'Tail light', vi: 'Đèn hậu' },
  { ja: 'ウインカー', en: 'Indicator', vi: 'Đèn xi nhan' },
  { ja: 'ミラー', en: 'Mirror', vi: 'Gương chiếu hậu' },
  { ja: 'ショックアブソーバー', en: 'Shock absorber', vi: 'Giảm xóc' },
  { ja: 'サスペンション', en: 'Suspension', vi: 'Phuộc' },
  { ja: 'ホイール', en: 'Wheel', vi: 'Vành xe' },
  { ja: 'ベアリング', en: 'Bearing', vi: 'Vòng bi' },
  { ja: 'ガスケット', en: 'Gasket', vi: 'Gioăng' },
  { ja: 'ケーブル', en: 'Cable', vi: 'Dây cáp' },
  { ja: 'ヒューズ', en: 'Fuse', vi: 'Cầu chì' },
  { ja: 'セルモーター', en: 'Starter motor', vi: 'Mô tơ đề' },
  { ja: 'マフラー', en: 'Muffler', vi: 'Ống xả' },
  { ja: 'クーラント', en: 'Coolant', vi: 'Nước làm mát' },
];

/**
 * Bo dau tieng Viet va ha chu thuong de so khop khong phu thuoc cach go.
 *
 * Giu nguyen so ky tu: moi chu co dau trong dang NFC la mot ma, tach dau roi
 * ghep lai van ra mot ma. Nho the chi so tim duoc tren chuoi da chuan hoa
 * dung luon cho chuoi goc — xem chot chan do dai trong `render`.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

/**
 * Tim moi vi tri cua mot thuat ngu trong chuoi da chuan hoa.
 *
 * Tieng Nhat viet lien khong co dau cach nen phai tim thang. Tieng Viet va
 * tieng Anh thi doi ranh gioi tu, neu khong "Oil" se khop vao giua chu
 * "Coil" va ten phu tung ra mot thu khong ai hieu.
 */
function findAll(hay: string, needle: string, from: Language): number[] {
  const out: number[] = [];
  if (!needle) return out;

  if (from === Language.JA) {
    for (let at = hay.indexOf(needle); at >= 0; at = hay.indexOf(needle, at + 1)) out.push(at);
    return out;
  }

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|[^a-z0-9])(${escaped})(?![a-z0-9])`, 'g');
  for (let m = pattern.exec(hay); m; m = pattern.exec(hay)) out.push(m.index + m[1].length);
  return out;
}

/**
 * Doi moi thuat ngu nhan ra duoc, giu nguyen phan con lai.
 *
 * Ten phu tung gan nhu luon la "thuat ngu + ma hang": "Ắc quy YTZ7V",
 * "エンジンオイル 10W30". Ma hang khong dich, nen chi thay dung cac doan
 * thuat ngu roi rap lai. Khong nhan ra tu nao thi tra nguyen van — de
 * nguyen ban tieng Nhat con doc duoc, con bo trong thi khong.
 */
function render(source: string, from: Language, to: Language): string {
  const hay = normalise(source);
  // Chuan hoa doi do dai (chuoi vao o dang NFD chang han) thi chi so lech.
  if (hay.length !== source.length) return source;

  const hits: { at: number; length: number; text: string }[] = [];
  for (const entry of GLOSSARY) {
    const needle = normalise(entry[from]);
    for (const at of findAll(hay, needle, from)) {
      hits.push({ at, length: needle.length, text: entry[to] });
    }
  }
  // Cum dai thang: "ブレーキパッド" phai an truoc "ブレーキ" o cung cho.
  hits.sort((a, b) => b.length - a.length || a.at - b.at);

  const chosen: typeof hits = [];
  for (const hit of hits) {
    const overlaps = chosen.some((c) => hit.at < c.at + c.length && hit.at + hit.length > c.at);
    if (!overlaps) chosen.push(hit);
  }
  if (chosen.length === 0) return source;

  chosen.sort((a, b) => a.at - b.at);
  const pieces: string[] = [];
  let cursor = 0;
  for (const hit of chosen) {
    pieces.push(source.slice(cursor, hit.at), hit.text);
    cursor = hit.at + hit.length;
  }
  pieces.push(source.slice(cursor));
  return joinPieces(pieces);
}

/**
 * Rap cac manh lai, chen dau cach o cho chu dinh vao nhau.
 *
 * Tieng Nhat viet lien nen "リアタイヤ" cat ra hai manh khong co dau cach o
 * giua; dich sang tieng Anh ma de nguyen thi ra "RearTyre". Chi chen khi it
 * nhat mot ben la chu Latin — hai tu tieng Nhat dung canh nhau thi khong.
 */
function joinPieces(pieces: string[]): string {
  let out = '';
  for (const piece of pieces) {
    if (!piece) continue;
    const left = out.slice(-1);
    const right = piece.slice(0, 1);
    const needsSpace =
      out && !/\s/.test(left) && !/\s/.test(right) && /[a-zA-Z0-9]/.test(left + right);
    out += needsSpace ? ` ${piece}` : piece;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Tra ve ban ghi da du ba thu tieng.
 *
 * `source` la thu tieng nguoi nhap dang go; hai thu con lai sinh ra tu do.
 * Lan sua sau go lai bang thu tieng khac thi ca hai ban dich duoc dung lai
 * theo ban moi — ten luon di theo o nguoi that vua go, khong de lai manh
 * vun cua lan truoc.
 */
export function fillTranslations(text: string, source: Language): I18nText {
  const value = text.trim().normalize('NFC');
  if (!value) return {};

  const out: I18nText = { [source]: value };
  for (const target of SUPPORTED_LANGUAGES) {
    if (target === source) continue;
    out[target] = render(value, source, target);
  }
  return out;
}
