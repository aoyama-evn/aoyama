import { Injectable, Logger } from '@nestjs/common';
import { DiagnosisFinding } from './entities/ai-diagnosis.entity';
import {
  AiProvider,
  DiagnoseInput,
  PartRecognitionResult,
  QuotationSuggestionInput,
  QuotationSuggestionLine,
  TechAnswer,
} from './ai.provider';

/**
 * Bo chan doan chay tai cho, dung khi chua noi dich vu AI ben ngoai.
 *
 * Doi chieu mo ta cua khach voi mot bang trieu chung viet san cho ba thu tieng,
 * roi tra ve nhung kha nang khop nhat kem ma dich vu tuong ung. Khong doan bua:
 * mo ta khong khop tu khoa nao thi tra ve rong, va man hinh se moi khach dat
 * lich de ky thuat vien kiem tra truc tiep (RK-01).
 *
 * Ket qua van la goi y — giao dien luon gan nhan "Goi y boi AI" va nhac phai co
 * ky thuat vien xac nhan. Khi da co AI_API_KEY thi LlmAiProvider thay cho lop
 * nay, khong phai sua gi o tang nghiep vu.
 */

interface SymptomRule {
  key: string;
  /** Nhan hien cho khach, theo ngon ngu cua phien. */
  label: Record<string, string>;
  description: Record<string, string>;
  /** Ma dich vu de xuat, loc lai theo danh muc dang ban truoc khi tra ve. */
  serviceCodes: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  /** Loai dich vu de cong diem khi khop y dinh khach da chon o dau phien. */
  intent: 'MAINTENANCE' | 'REPAIR';
  /**
   * Tu khoa da chuan hoa (chu thuong, bo dau). Tieng Nhat giu nguyen.
   * Tu khoa dai hon duoc tinh nang hon vi no cu the hon.
   */
  keywords: string[];
}

const RULES: SymptomRule[] = [
  {
    key: 'BRAKE',
    label: {
      ja: 'ブレーキの不具合',
      en: 'Brake problem',
      vi: 'Vấn đề hệ thống phanh',
    },
    description: {
      ja: 'ブレーキパッドの摩耗、ディスクの歪み、またはブレーキフルード不足が考えられます。',
      en: 'Worn brake pads, a warped disc, or low brake fluid are the likely causes.',
      vi: 'Nhiều khả năng do má phanh mòn, đĩa phanh cong vênh hoặc thiếu dầu phanh.',
    },
    serviceCodes: ['SVC-REPAIR-BRAKE-TYRE', 'SVC-MAINT-INSPECT'],
    severity: 'HIGH',
    intent: 'REPAIR',
    keywords: [
      'phanh', 'thang gap', 'ma phanh', 'dia phanh', 'bop phanh', 'an phanh',
      'khong an', 'bo phanh', 'ken ket', 'ket ket', 'phanh truoc', 'phanh sau',
      'brake', 'braking', 'brake pad', 'disc', 'squeal', 'squeak', 'grind',
      'ブレーキ', 'パッド', '制動', '効かない', '鳴き', 'ディスク',
    ],
  },
  {
    key: 'TYRE',
    label: {
      ja: 'タイヤ・ホイールの不具合',
      en: 'Tyre or wheel problem',
      vi: 'Vấn đề lốp hoặc bánh xe',
    },
    description: {
      ja: 'タイヤの摩耗、空気圧不足、パンク、またはホイールバランスの崩れが考えられます。',
      en: 'Worn tread, low pressure, a puncture, or an unbalanced wheel are the likely causes.',
      vi: 'Nhiều khả năng do lốp mòn, non hơi, thủng săm hoặc bánh xe mất cân bằng.',
    },
    serviceCodes: ['SVC-REPAIR-BRAKE-TYRE'],
    severity: 'HIGH',
    intent: 'REPAIR',
    keywords: [
      'lop', 'vo xe', 'sam', 'xam', 'thung', 'non hoi', 'het hoi', 'mon lop',
      'rung tay lai', 'lang', 'danh vong', 'vanh', 'banh xe', 'ap suat',
      'tyre', 'tire', 'puncture', 'flat', 'tread', 'wobble', 'wheel', 'pressure',
      'タイヤ', 'パンク', '空気圧', '摩耗', 'ホイール', 'ふらつく',
    ],
  },
  {
    key: 'ENGINE',
    label: {
      ja: 'エンジンの不調',
      en: 'Engine trouble',
      vi: 'Động cơ hoạt động bất thường',
    },
    description: {
      ja: '点火系、燃料供給、または圧縮の低下が考えられます。実車の点検が必要です。',
      en: 'Ignition, fuel delivery, or loss of compression are the likely causes. The bike needs a hands-on check.',
      vi: 'Nhiều khả năng do hệ thống đánh lửa, cấp nhiên liệu hoặc giảm áp suất nén. Cần kiểm tra trực tiếp.',
    },
    serviceCodes: ['SVC-REPAIR-ENGINE', 'SVC-MAINT-INSPECT'],
    severity: 'HIGH',
    intent: 'REPAIR',
    keywords: [
      'may keu', 'go may', 'hut ga', 'yeu may', 'khong len ga', 'chet may',
      'nong may', 'khoi', 'i may', 'giat', 'rung may', 'khong no', 'tat may',
      'dong co', 'mat cong suat', 'hao xang', 'no lon',
      'engine', 'knock', 'stall', 'overheat', 'smoke', 'power loss', 'misfire',
      'rough idle', 'vibration',
      'エンジン', '異音', '止まる', '加速', '白煙', 'オーバーヒート', '振動',
      'かからない', 'アイドリング',
    ],
  },
  {
    key: 'OIL',
    label: {
      ja: 'エンジンオイルの不具合',
      en: 'Engine oil issue',
      vi: 'Vấn đề dầu máy',
    },
    description: {
      ja: 'オイルの劣化、量の不足、または漏れが考えられます。',
      en: 'Degraded oil, a low level, or a leak are the likely causes.',
      vi: 'Nhiều khả năng do dầu đã xuống cấp, thiếu dầu hoặc bị rò rỉ.',
    },
    serviceCodes: ['SVC-MAINT-OIL', 'SVC-MAINT-PERIODIC'],
    severity: 'MEDIUM',
    intent: 'MAINTENANCE',
    keywords: [
      'dau may', 'nhot', 'thay dau', 'ro dau', 'chay nhot', 'chay dau',
      'het dau', 'den han thay dau', 'loc dau',
      'oil', 'oil change', 'oil leak', 'oil filter', 'lubricant',
      'オイル', '油', '漏れ', 'オイル交換', 'フィルター',
    ],
  },
  {
    key: 'ELECTRIC',
    label: {
      ja: '電装系・バッテリーの不具合',
      en: 'Electrical or battery problem',
      vi: 'Vấn đề điện hoặc ắc quy',
    },
    description: {
      ja: 'バッテリーの消耗、充電系統、またはヒューズや配線の不良が考えられます。',
      en: 'A worn battery, the charging circuit, or a fuse or wiring fault are the likely causes.',
      vi: 'Nhiều khả năng do ắc quy yếu, hệ thống sạc, hoặc đứt cầu chì và dây điện.',
    },
    serviceCodes: ['SVC-REPAIR-ELECTRIC', 'SVC-MAINT-INSPECT'],
    severity: 'MEDIUM',
    intent: 'REPAIR',
    keywords: [
      'ac quy', 'binh dien', 'de khong no', 'de yeu', 'khong de duoc', 'den',
      'coi', 'xi nhan', 'dien', 'sac', 'yeu dien', 'cau chi', 'day dien',
      'dong ho', 'khong sang', 'de no',
      'battery', 'starter', 'wont start', 'will not start', 'light', 'horn',
      'indicator', 'electrical', 'charging', 'fuse', 'wiring',
      'バッテリー', 'セル', '始動', 'ライト', 'ウインカー', '電装', '充電',
      'ヒューズ', 'ホーン',
    ],
  },
  {
    key: 'DRIVETRAIN',
    label: {
      ja: 'チェーン・駆動系の不具合',
      en: 'Chain or drivetrain problem',
      vi: 'Vấn đề xích hoặc bộ truyền động',
    },
    description: {
      ja: 'チェーンの張り、給油不足、スプロケットやベルトの摩耗が考えられます。',
      en: 'Chain tension, missing lubrication, or a worn sprocket or belt are the likely causes.',
      vi: 'Nhiều khả năng do xích chùng, thiếu dầu bôi trơn, hoặc nhông và dây curoa mòn.',
    },
    serviceCodes: ['SVC-MAINT-PERIODIC', 'SVC-MAINT-INSPECT'],
    severity: 'MEDIUM',
    intent: 'MAINTENANCE',
    keywords: [
      'xich', 'sen', 'day curoa', 'curoa', 'nhong', 'truot con', 'con',
      'vao so', 'sang so', 'nhay so', 'keu lach cach', 'chung xich',
      'chain', 'belt', 'sprocket', 'clutch', 'gear', 'shifting', 'slipping',
      'チェーン', 'ベルト', 'スプロケット', 'クラッチ', 'ギア', '変速',
    ],
  },
  {
    key: 'BODY',
    label: {
      ja: '外装のキズ・へこみ',
      en: 'Bodywork damage',
      vi: 'Hư hỏng phần vỏ và sơn',
    },
    description: {
      ja: '外装の傷、へこみ、割れの補修と塗装で対応できます。',
      en: 'Scratches, dents or cracks in the bodywork can be repaired and repainted.',
      vi: 'Có thể xử lý bằng cách phục hồi phần trầy xước, móp, nứt rồi sơn lại.',
    },
    serviceCodes: ['SVC-REPAIR-PAINT'],
    severity: 'LOW',
    intent: 'REPAIR',
    keywords: [
      'tray', 'xuoc', 'mop', 'be', 'nut', 'son', 'va quet', 'tai nan', 'gay',
      'do xe', 'nga xe', 'vo nhua', 'bien dang',
      'scratch', 'dent', 'crack', 'paint', 'bodywork', 'crash', 'fairing',
      '傷', 'キズ', 'へこみ', '割れ', '塗装', '転倒', '外装',
    ],
  },
  {
    key: 'PERIODIC',
    label: {
      ja: '定期点検の時期',
      en: 'Periodic service due',
      vi: 'Đến kỳ bảo dưỡng định kỳ',
    },
    description: {
      ja: '走行距離や前回からの期間から、定期点検の時期と考えられます。',
      en: 'Based on distance or time since the last visit, a periodic service looks due.',
      vi: 'Theo số km hoặc thời gian từ lần bảo dưỡng trước, xe đã đến kỳ bảo dưỡng.',
    },
    serviceCodes: ['SVC-MAINT-PERIODIC', 'SVC-MAINT-INSPECT', 'SVC-PACKAGE-CARE-12M'],
    severity: 'LOW',
    intent: 'MAINTENANCE',
    keywords: [
      'bao duong', 'dinh ky', 'den han', 'kiem tra tong quat', 'bao tri',
      'kiem tra dinh ky', 'bao duong dinh ky', 'kiem tra xe',
      'maintenance', 'service', 'periodic', 'due', 'checkup', 'check up',
      'inspection',
      '点検', '整備', '定期', 'メンテナンス', '車検',
    ],
  },
];

/**
 * Bo dau tieng Viet va ha chu thuong de so khop khong phu thuoc cach go.
 * Tieng Nhat khong bi anh huong: dau daku (U+3099) nam ngoai khoang dau Latin,
 * va buoc normalize('NFC') cuoi cung ghep lai nhu cu.
 */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}

@Injectable()
export class RuleBasedAiProvider implements AiProvider {
  private readonly logger = new Logger('AI');

  async diagnose(input: DiagnoseInput): Promise<DiagnosisFinding[]> {
    const haystack = normalise([input.description, input.transcript].filter(Boolean).join(' '));

    // Mo ta qua ngan thi khong du co so de doan — de man hinh moi khach noi them.
    if (haystack.trim().length < 3) return [];

    const sellable = new Set(input.availableServices.map((s) => s.code));
    const lang = ['ja', 'en', 'vi'].includes(input.language) ? input.language : 'ja';

    const scored = RULES.map((rule) => {
      const hits = rule.keywords.filter((k) => haystack.includes(k));
      if (hits.length === 0) return null;

      // Tu khoa dai hon thi cu the hon, nen tinh nang hon mot chut.
      const weight = hits.reduce((sum, k) => sum + (k.length >= 8 ? 2 : 1), 0);
      // Khop dung y dinh khach chon o dau phien thi cong them.
      const intentBonus = input.serviceIntent && input.serviceIntent === rule.intent ? 6 : 0;

      return { rule, hits: hits.length, score: Math.min(92, 46 + weight * 9 + intentBonus) };
    }).filter((x): x is { rule: SymptomRule; hits: number; score: number } => x !== null);

    if (scored.length === 0) {
      this.logger.debug('Mo ta khong khop trieu chung nao — tra ve ket qua rong');
      return [];
    }

    return scored
      .sort((a, b) => b.score - a.score || b.hits - a.hits)
      .slice(0, 3)
      .map(({ rule, score }) => ({
        label: rule.label[lang] ?? rule.label.ja,
        matchPercent: score,
        description: rule.description[lang] ?? rule.description.ja,
        // Chi de xuat dich vu cua hang thuc su dang ban.
        suggestedServiceCodes: rule.serviceCodes.filter((c) => sellable.has(c)),
        severity: rule.severity,
      }));
  }

  /**
   * Cac tac vu con lai chua co ban chay tai cho — giu nguyen hanh vi cu de
   * khong am tham doi ket qua o nhung man hinh khac.
   */
  async suggestQuotation(_input: QuotationSuggestionInput): Promise<QuotationSuggestionLine[]> {
    return [];
  }

  async recognizePart(): Promise<PartRecognitionResult> {
    return {};
  }

  async answerTechnical(): Promise<TechAnswer> {
    return { answer: 'Chua co du lieu de tra loi cau hoi nay.', citations: [] };
  }
}
