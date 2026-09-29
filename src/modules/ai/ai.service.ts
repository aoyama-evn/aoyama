import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { PageDto, PaginationQueryDto } from 'src/common/dto';
import { DEFAULT_LANGUAGE, Language } from 'src/common/enums';
import { pickI18n } from 'src/common/types';
import { CatalogService } from 'src/modules/catalog/catalog.service';
import { PartsService } from 'src/modules/parts/parts.service';
import { SettingsService, SETTING_KEYS } from 'src/modules/system/settings.service';
import { WorkOrdersService } from 'src/modules/work-orders/work-orders.service';
import {
  AI_PROVIDER,
  AiProvider,
  PartRecognitionResult,
  QuotationSuggestionLine,
  TechAnswer,
} from './ai.provider';
import { AiDiagnosis, DiagnosisFinding, DiagnosisMessage } from './entities/ai-diagnosis.entity';
import { KnowledgeDocument } from './entities/knowledge-document.entity';

/** M-03 Chatbox AI chan doan va M-12 Tro ly AI ky thuat. */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @InjectRepository(AiDiagnosis) private readonly diagnosisRepo: Repository<AiDiagnosis>,
    @InjectRepository(KnowledgeDocument)
    private readonly knowledgeRepo: Repository<KnowledgeDocument>,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly catalog: CatalogService,
    private readonly parts: PartsService,
    private readonly workOrders: WorkOrdersService,
    private readonly settings: SettingsService,
  ) {}

  // ---------------- SC-10, SC-11 — Chatbox chan doan ----------------

  /** FR-AI-01 — mo phien chat moi. */
  async startSession(input: {
    sessionKey: string;
    language?: Language;
    customerId?: string | null;
    vehicleMaker?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    /** SC-10 — khach chon duoc nhieu y dinh cung luc. */
    serviceIntents?: string[];
  }): Promise<AiDiagnosis> {
    const retentionDays = this.settings.getNumber(
      SETTING_KEYS.AI_MEDIA_RETENTION_DAYS,
      undefined,
      30,
    );
    return this.diagnosisRepo.save(
      this.diagnosisRepo.create({
        sessionKey: input.sessionKey,
        language: input.language ?? DEFAULT_LANGUAGE,
        customerId: input.customerId ?? null,
        vehicleMaker: input.vehicleMaker ?? null,
        vehicleModel: input.vehicleModel ?? null,
        vehicleYear: input.vehicleYear ?? null,
        // Luu thanh chuoi ngan cach dau phay; provider tach lai khi cham diem.
        serviceIntent: input.serviceIntents?.length ? input.serviceIntents.join(',') : null,
        messages: [],
        findings: [],
        status: 'PENDING',
        mediaExpiresAt: new Date(Date.now() + retentionDays * 86_400_000),
      }),
    );
  }

  async findSession(id: string): Promise<AiDiagnosis> {
    const session = await this.diagnosisRepo.findOne({ where: { id } });
    if (!session) {
      throw new NotFoundException({
        code: 'DIAGNOSIS_NOT_FOUND',
        message: 'Khong tim thay phien chan doan',
      });
    }
    return session;
  }

  /**
   * FR-AI-02..06 — khach gui mo ta, anh hoac ghi am; AI tra ve loi nghi ngo kem %.
   * Khi dich vu AI khong phan hoi, phien duoc danh dau FAILED va man hinh
   * chuyen sang cho khach mo ta thu cong (RK-01).
   */
  async sendMessage(
    sessionId: string,
    input: { text?: string; imageUrls?: string[]; audioUrl?: string; transcript?: string },
  ): Promise<AiDiagnosis> {
    const session = await this.findSession(sessionId);

    const userMessage: DiagnosisMessage = {
      role: 'user',
      text: input.text,
      imageUrls: input.imageUrls,
      audioUrl: input.audioUrl,
      transcript: input.transcript,
      at: new Date().toISOString(),
    };
    session.messages = [...session.messages, userMessage];

    const services = await this.catalog.findPublic();
    const startedAt = Date.now();

    let findings: DiagnosisFinding[] = [];
    try {
      findings = await this.provider.diagnose({
        description: input.text,
        transcript: input.transcript,
        imageUrls: input.imageUrls,
        vehicleMaker: session.vehicleMaker,
        vehicleModel: session.vehicleModel,
        serviceIntent: session.serviceIntent,
        language: session.language,
        availableServices: services.map((s) => ({
          code: s.code,
          name: pickI18n(s.name, session.language),
          type: s.type,
        })),
      });
      session.status = findings.length > 0 ? 'COMPLETED' : 'FAILED';
    } catch (error) {
      this.logger.error(`Chan doan AI that bai cho phien ${sessionId}`);
      session.status = 'FAILED';
    }

    session.latencyMs = Date.now() - startedAt;
    // FR-AI-06 — sap xep theo muc do khop giam dan de man hinh hien dung thu tu.
    session.findings = [...findings].sort((a, b) => b.matchPercent - a.matchPercent);
    session.messages = [
      ...session.messages,
      {
        role: 'assistant',
        text:
          session.findings.length > 0
            ? 'Duoi day la cac kha nang phu hop nhat voi mo ta cua ban.'
            : 'Chua du thong tin de chan doan. Ban co the mo ta them hoac dat lich de ky thuat vien kiem tra truc tiep.',
        at: new Date().toISOString(),
      },
    ];

    return this.diagnosisRepo.save(session);
  }

  /** Gan phien chan doan vao lich hen khi khach bam dat lich tu SC-11. */
  async attachToBooking(sessionId: string, bookingId: string): Promise<void> {
    await this.diagnosisRepo.update(sessionId, { bookingId });
  }

  // ---------------- AI-02 — Goi y bao gia (SA-12) ----------------

  /**
   * FR-QUO-11 — AI goi y hang muc va phu tung cho bao gia.
   * Ket qua la de xuat; Admin bat buoc phai duyet truoc khi gui khach.
   */
  async suggestQuotation(workOrderId: string): Promise<{
    lines: QuotationSuggestionLine[];
    generatedAt: string;
    isFallback: boolean;
  }> {
    const workOrder = await this.workOrders.findById(workOrderId);
    const services = await this.catalog.findPublic();
    // Chi lay mot trang phu tung dang ban de gioi han do dai lenh gui cho mo hinh.
    // Dung the hien that cua DTO vi PartsService doc getter `skip` cua no.
    const partQuery = Object.assign(new PaginationQueryDto(), {
      page: 1,
      limit: 100,
      isActive: true,
    });
    const parts = await this.parts.search(partQuery);

    const lines = await this.provider.suggestQuotation({
      vehicleMaker: workOrder.vehicle?.maker,
      vehicleModel: workOrder.vehicle?.model,
      engineCc: workOrder.vehicle?.engineCc,
      symptom: workOrder.customerSymptom,
      diagnosis: workOrder.diagnosisNote,
      availableServices: services.map((s) => ({
        code: s.code,
        name: pickI18n(s.name, DEFAULT_LANGUAGE),
        basePrice: s.basePrice,
      })),
      availableParts: parts.items.map((p) => ({
        code: p.code,
        name: pickI18n(p.name, DEFAULT_LANGUAGE),
        sellPrice: p.sellPrice,
      })),
    });

    return {
      lines,
      generatedAt: new Date().toISOString(),
      isFallback: lines.length === 0,
    };
  }

  // ---------------- AI-04 — Nhan dang phu tung tu anh (SA-27) ----------------

  /** FR-PRT-04..07 — dien san bieu mau phu tung; Admin kiem tra roi moi luu (BR-43). */
  async recognizePart(
    imageUrls: string[],
  ): Promise<PartRecognitionResult & { isFallback: boolean }> {
    const result = await this.provider.recognizePart(imageUrls);
    return { ...result, isFallback: Object.keys(result).length === 0 };
  }

  // ---------------- AI-03 — Tro ly ky thuat (SA-30, SA-31) ----------------

  /**
   * FR-TEC-01..04 — tra loi kem trich dan nguon.
   * Neu khong tim duoc tai lieu lien quan thi tra ve "khong co du lieu"
   * thay vi de mo hinh suy doan (FR-TEC-07).
   */
  async askTechnical(
    question: string,
    filters?: { maker?: string; model?: string },
  ): Promise<TechAnswer> {
    const documents = await this.searchKnowledge(question, filters);
    if (documents.length === 0) {
      return { answer: 'Chua co du lieu de tra loi cau hoi nay.', citations: [] };
    }
    return this.provider.answerTechnical(
      question,
      documents.map((d) => `[${d.id}] ${d.title}\n${(d.content ?? '').slice(0, 4000)}`),
    );
  }

  private async searchKnowledge(
    question: string,
    filters?: { maker?: string; model?: string },
  ): Promise<KnowledgeDocument[]> {
    const qb = this.knowledgeRepo
      .createQueryBuilder('d')
      .where('d.index_status = :status', { status: 'INDEXED' })
      .andWhere('(d.title ILIKE :q OR d.content ILIKE :q)', { q: `%${question.slice(0, 80)}%` });

    if (filters?.maker) {
      qb.andWhere('d.applicable_makers::text ILIKE :maker', { maker: `%${filters.maker}%` });
    }
    if (filters?.model) {
      qb.andWhere('d.applicable_models::text ILIKE :model', { model: `%${filters.model}%` });
    }
    return qb.take(5).getMany();
  }

  // ---------------- SA-31 — Kho tai lieu ky thuat ----------------

  async listDocuments(
    query: PaginationQueryDto & { keyword?: string; category?: string },
  ): Promise<PageDto<KnowledgeDocument>> {
    const qb = this.knowledgeRepo.createQueryBuilder('d');
    if (query.keyword) qb.andWhere('d.title ILIKE :kw', { kw: `%${query.keyword}%` });
    if (query.category) qb.andWhere('d.category = :category', { category: query.category });

    const [items, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getManyAndCount();
    return new PageDto(items, total, query);
  }

  async addDocument(data: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    return this.knowledgeRepo.save(this.knowledgeRepo.create(data));
  }

  async removeDocument(id: string): Promise<void> {
    await this.knowledgeRepo.softDelete(id);
  }

  /** RK-07 — xoa tep dinh kem qua han luu tru. */
  async purgeExpiredMedia(): Promise<number> {
    const expired = await this.diagnosisRepo.find({
      where: { mediaExpiresAt: LessThan(new Date()) },
      take: 500,
    });
    for (const session of expired) {
      session.messages = session.messages.map((m) => ({
        ...m,
        imageUrls: undefined,
        audioUrl: undefined,
      }));
      session.mediaExpiresAt = null;
      await this.diagnosisRepo.save(session);
    }
    return expired.length;
  }
}
