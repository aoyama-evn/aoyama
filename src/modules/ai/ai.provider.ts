import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiagnosisFinding } from './entities/ai-diagnosis.entity';

export interface DiagnoseInput {
  description?: string;
  transcript?: string;
  imageUrls?: string[];
  vehicleMaker?: string | null;
  vehicleModel?: string | null;
  serviceIntent?: string | null;
  language: string;
  /** Danh muc dich vu dang ban, de AI chi goi y thu cua hang thuc su lam. */
  availableServices: { code: string; name: string; type: string }[];
}

export interface QuotationSuggestionInput {
  vehicleMaker?: string | null;
  vehicleModel?: string | null;
  engineCc?: number | null;
  symptom?: string | null;
  diagnosis?: string | null;
  availableServices: { code: string; name: string; basePrice: number }[];
  availableParts: { code: string; name: string; sellPrice: number }[];
}

export interface QuotationSuggestionLine {
  kind: 'LABOR' | 'PART';
  code?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  reason?: string;
}

export interface PartRecognitionResult {
  name?: string;
  makerPartNo?: string;
  maker?: string;
  category?: string;
  specification?: string;
  compatibleVehicles?: string[];
  confidence?: number;
}

export interface TechAnswer {
  answer: string;
  citations: { documentId: string; title: string; excerpt: string }[];
}

export const AI_PROVIDER = 'AI_PROVIDER';

export interface AiProvider {
  diagnose(input: DiagnoseInput): Promise<DiagnosisFinding[]>;
  suggestQuotation(input: QuotationSuggestionInput): Promise<QuotationSuggestionLine[]>;
  recognizePart(imageUrls: string[]): Promise<PartRecognitionResult>;
  answerTechnical(question: string, context: string[]): Promise<TechAnswer>;
}

/**
 * Driver mac dinh khi AI_ENABLED=false.
 * Tra ve ket qua rong thay vi nem loi, de cac man hinh nghiep vu van dung duoc
 * o che do thu cong (OV-2026-001 muc 9, nguyen tac 4).
 */
@Injectable()
export class DisabledAiProvider implements AiProvider {
  private readonly logger = new Logger('AI');

  async diagnose(): Promise<DiagnosisFinding[]> {
    this.logger.debug('AI dang tat — tra ve ket qua chan doan rong');
    return [];
  }

  async suggestQuotation(): Promise<QuotationSuggestionLine[]> {
    return [];
  }

  async recognizePart(): Promise<PartRecognitionResult> {
    return {};
  }

  async answerTechnical(): Promise<TechAnswer> {
    // FR-TEC-07 — khong tim duoc nguon thi noi khong co du lieu, khong suy doan.
    return { answer: 'Chua co du lieu de tra loi cau hoi nay.', citations: [] };
  }
}

/**
 * Khung goi mo hinh ngon ngu that.
 * Giu nguyen giao dien AiProvider de doi nha cung cap khong lan sang nghiep vu.
 * Chi tiet endpoint va dinh dang lenh se hoan thien khi chot dich vu AI.
 */
@Injectable()
export class LlmAiProvider implements AiProvider {
  private readonly logger = new Logger('AI');

  constructor(private readonly config: ConfigService) {}

  private get apiKey(): string {
    return this.config.get<string>('ai.apiKey', '');
  }

  async diagnose(input: DiagnoseInput): Promise<DiagnosisFinding[]> {
    if (!this.apiKey) {
      this.logger.warn('Thieu AI_API_KEY — bo qua buoc chan doan');
      return [];
    }
    return this.callModel<DiagnosisFinding[]>('diagnose', input, []);
  }

  async suggestQuotation(input: QuotationSuggestionInput): Promise<QuotationSuggestionLine[]> {
    if (!this.apiKey) return [];
    return this.callModel<QuotationSuggestionLine[]>('quotation', input, []);
  }

  async recognizePart(imageUrls: string[]): Promise<PartRecognitionResult> {
    if (!this.apiKey) return {};
    return this.callModel<PartRecognitionResult>('part', { imageUrls }, {});
  }

  async answerTechnical(question: string, context: string[]): Promise<TechAnswer> {
    if (!this.apiKey) {
      return { answer: 'Chua co du lieu de tra loi cau hoi nay.', citations: [] };
    }
    return this.callModel<TechAnswer>(
      'technical',
      { question, context },
      {
        answer: 'Chua co du lieu de tra loi cau hoi nay.',
        citations: [],
      },
    );
  }

  /**
   * Diem goi duy nhat ra dich vu ngoai. Het thoi gian cho hoac loi mang deu
   * tra ve gia tri lui, khong nem ra ngoai — nghiep vu phai chay tiep duoc.
   */
  private async callModel<T>(task: string, _payload: unknown, fallback: T): Promise<T> {
    const timeout = this.config.get<number>('ai.timeoutMs', 10_000);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        // Cho tich hop dich vu AI thuc te — xem AI-01..AI-05.
        this.logger.warn(`Chua cai dat lop goi mo hinh cho tac vu "${task}"`);
        return fallback;
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      this.logger.error(`Goi dich vu AI that bai cho tac vu "${task}"`);
      return fallback;
    }
  }
}
